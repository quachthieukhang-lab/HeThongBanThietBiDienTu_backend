import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CreateChatDto } from './dto/create-chat.dto';
import { ProductsService } from '../products/products.service';
import { ChatHistoryService } from '@chat-history/chat-history.service'; // Import ChatHistoryService

interface AnalyzedQuery {
  keywords: string;
  filters?: { [key: string]: any };
}

@Injectable()
export class ChatService {
  private client: OpenAI;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService, // Inject ProductsService
    private chatHistoryService: ChatHistoryService, // Inject ChatHistoryService
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1', // QUAN TRỌNG
    });
  }

  /**
   * BƯỚC 1: Phân tích ý định của người dùng bằng AI.
   * AI sẽ phân tích câu hỏi và trả về một đối tượng JSON chứa từ khóa và bộ lọc.
   * @param userMessage - Tin nhắn của người dùng.
   * @returns - Một đối tượng JSON đã được phân tích.
   */
  private async analyzeUserIntent(userMessage: string): Promise<AnalyzedQuery> {
    const analysisPrompt = `Bạn là một hệ thống phân tích truy vấn thông minh. Nhiệm vụ của bạn là đọc tin nhắn của người dùng và chuyển đổi nó thành một đối tượng JSON để tìm kiếm sản phẩm trong cơ sở dữ liệu.
Đối tượng JSON phải có cấu trúc: { "keywords": "string", "filters": { "brand": "string", "price_range": "string" } }.
- "keywords": Từ khóa chính về sản phẩm (ví dụ: "tivi", "laptop gaming", "máy giặt cửa trước").
- "filters": Các bộ lọc tùy chọn.
  - "brand": Tên thương hiệu (ví dụ: "Sony", "LG", "Samsung").
  - "price_range": Khoảng giá (ví dụ: "dưới 10 triệu", "từ 15 đến 20 triệu").

CHỈ trả về đối tượng JSON, không thêm bất kỳ giải thích nào.

Ví dụ:
1. User: "tìm cho tôi tivi Sony dưới 15 triệu"
   {"keywords": "tivi", "filters": {"brand": "Sony", "price_range": "dưới 15 triệu"}}
2. User: "có laptop gaming nào không?"
   {"keywords": "laptop gaming", "filters": {}}
3. User: "máy giặt"
   {"keywords": "máy giặt", "filters": {}}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' }, // Yêu cầu AI trả về JSON
      });

      const result = completion.choices[0].message.content;
      if (result) {
        this.logger.log(`Analyzed user intent for "${userMessage}": ${result}`);
        return JSON.parse(result);
      }
      // If result is null, throw an error to be caught by the catch block below.
      throw new Error('AI analysis returned empty content.');
    } catch (error) {
      this.logger.error('Failed to analyze user intent. Falling back to basic search.', error);
      // Nếu AI phân tích lỗi, quay lại tìm kiếm cơ bản
      return { keywords: userMessage, filters: {} };
    }
  }

  /**
   * BƯỚC 2: Truy xuất dữ liệu từ DB dựa trên kết quả phân tích.
   * @param query - Kết quả phân tích từ `analyzeUserIntent`.
   * @returns - Chuỗi ngữ cảnh chứa thông tin sản phẩm hoặc thông báo không tìm thấy.
   */
  private async getContextFromDb(query: AnalyzedQuery): Promise<string> {
    try {
      // TODO: Nâng cấp `productsService.search` để xử lý các bộ lọc phức tạp hơn từ `query.filters`
      const products = await this.productsService.search({ keyword: query.keywords });

      if (products && products.length > 0) {
        const productDetails = products
          .map(p => {
            const brandName = (p.brandId as any)?.name || 'N/A';
            const subcategoryName = (p.subcategoryId as any)?.name || 'N/A';
            const servicePackages = (p.servicePackageIds as any[])?.map(sp => sp.name).join(', ') || 'Không có';

            return (`- Tên sản phẩm: ${p.name}\n` +
                    `  - Thương hiệu: ${brandName}\n` +
                    `  - Loại: ${subcategoryName}\n` +
                    `  - Giá từ: ${p.priceFrom.toLocaleString('vi-VN')} VNĐ\n` +
                    `  - Dịch vụ kèm theo: ${servicePackages}`);
          })
          .join('\n\n');

        const contextData = `Dưới đây là thông tin các sản phẩm liên quan đến truy vấn của người dùng mà hệ thống tìm thấy:\n\n${productDetails}`;
        this.logger.log(`Context for AI: Found ${products.length} products.`);
        return contextData;
      }

      this.logger.warn(`No products found for query: ${JSON.stringify(query)}`);
      return 'Không tìm thấy thông tin sản phẩm nào phù hợp trong hệ thống.';
    } catch (dbError) {
      this.logger.error('Failed to retrieve data from database', dbError);
      // Trả về thông báo lỗi để AI biết và phản hồi một cách lịch sự.
      return 'Đã có lỗi xảy ra khi truy vấn dữ liệu sản phẩm.';
    }
  }

  /**
   * BƯỚC 3: Gọi AI lần 2 với ngữ cảnh đã được chuẩn bị để sinh câu trả lời.
   * @param userId - ID của người dùng để lấy lịch sử trò chuyện.
   * @param contextData - Dữ liệu ngữ cảnh từ DB.
   * @param userMessage - Câu hỏi gốc của người dùng.
   * @returns - Phản hồi từ AI.
   */
  private async callAI(userId: string, contextData: string, userMessage: string) {
    const systemPrompt = `Bạn là một trợ lý ảo bán hàng chuyên nghiệp và thân thiện của cửa hàng điện máy.
NGUYÊN TẮC VÀNG:
1.  **TUÂN THỦ NGỮ CẢNH**: CHỈ trả lời dựa trên thông tin trong phần "DỮ LIỆU HỆ THỐNG". TUYỆT ĐỐI không bịa đặt thông tin sản phẩm, giá cả, hay chính sách không được cung cấp.
2.  **TƯ VẤN BÁN HÀNG**: Khi có sản phẩm, hãy tóm tắt ngắn gọn, nhấn mạnh các điểm nổi bật (giá, thương hiệu) và mời khách hàng tham khảo. Giọng văn tự nhiên, thân thiện, có thể dùng emoji (💻, 📱, 🛒).
3.  **XỬ LÝ KHI KHÔNG TÌM THẤY**: Nếu "DỮ LIỆU HỆ THỐNG" báo "Không tìm thấy", hãy lịch sự xin lỗi và gợi ý khách hàng cung cấp từ khóa khác rõ ràng hơn (ví dụ: "laptop gaming" thay vì "máy tính").
4.  **XỬ LÝ LỖI**: Nếu "DỮ LIỆU HỆ THỐNG" báo "lỗi", hãy xin lỗi vì sự cố kỹ thuật và nói rằng bạn không thể tra cứu thông tin lúc này.

--- DỮ LIỆU HỆ THỐNG ---
${contextData}
--- KẾT THÚC DỮ LIỆU ---
`;

    // Lấy lịch sử trò chuyện của người dùng
    const conversationHistory = await this.chatHistoryService.getConversationHistory(userId);

    // Xây dựng mảng messages cho AI, bao gồm system prompt, lịch sử và câu hỏi hiện tại
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory, // Thêm lịch sử trò chuyện
      { role: 'user', content: userMessage }, // Thêm câu hỏi hiện tại của người dùng
    ];

    try {
      const completion = await this.client.chat.completions.create({
        model: 'deepseek/deepseek-chat',
        messages: messages, // Sử dụng mảng messages đã có lịch sử
      });

      return completion;
    } catch (error) {
      this.logger.error('OpenRouter API Error:', error);
      throw new InternalServerErrorException('Failed to communicate with AI service');
    }
  }

  /**
   * Luồng chat chính, điều phối 2 bước: lấy ngữ cảnh và gọi AI.
   */
  async chat(dto: CreateChatDto, userId: string) {
    // BƯỚC 1: AI phân tích ý định của người dùng
    const analyzedQuery = await this.analyzeUserIntent(dto.message);

    // BƯỚC 2: Truy xuất dữ liệu từ DB làm ngữ cảnh
    const contextData = await this.getContextFromDb(analyzedQuery);

    // BƯỚC 3: Gọi AI lần 2 để sinh câu trả lời hoàn chỉnh, truyền userId để lấy lịch sử
    const completion = await this.callAI(userId, contextData, dto.message);

    const aiResponseContent = completion.choices[0]?.message?.content || 'Xin lỗi, tôi chưa thể xử lý yêu cầu của bạn lúc này.';

    // LƯU LỊCH SỬ TRÒ CHUYỆN (USER & ASSISTANT) ĐỒNG THỜI
    await Promise.all([
      this.chatHistoryService.saveMessage(userId, 'user', dto.message),
      this.chatHistoryService.saveMessage(userId, 'assistant', aiResponseContent),
    ]);

    return {
      response: aiResponseContent,
      usage: completion.usage,
    };
  }
}
