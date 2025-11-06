// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ProductsService } from '../products/products.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService, // Inject service sản phẩm
    private readonly subcategoriesService: SubcategoriesService,
    private readonly brandsService: BrandsService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Bước 1: Phân tích ý định và trích xuất thực thể từ tin nhắn người dùng
    const analysisPrompt = `
      Phân tích tin nhắn của khách hàng cho một trang web thương mại điện tử bán thiết bị điện tử và trích xuất các thực thể sau:
      - intent: Ý định của người dùng. Các giá trị có thể là: "search_product", "ask_policy", "greeting", "other".
      - keywords: Các từ khóa chính mô tả sản phẩm (ví dụ: "laptop gaming", "tai nghe không dây").
      - brand: Tên thương hiệu (ví dụ: "Asus", "Sony").
      - subcategory: Tên danh mục con (ví dụ: "Điện thoại", "Laptop").
      - price_min: Giá tối thiểu.
      - price_max: Giá tối đa.
      - attributes: Các thuộc tính khác (ví dụ: "màu đỏ", "16GB RAM").

      Chuyển đổi giá trị tiền tệ sang số (ví dụ: "20 triệu" -> 20000000).
      Chỉ trả về một đối tượng JSON hợp lệ. Nếu không tìm thấy thực thể nào, hãy trả về một đối tượng trống.

      Tin nhắn của khách hàng: "${userMessage}"
    `;

    const analysisCompletion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106', // Model này trả về JSON tốt hơn
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    let analysisResult: {
      intent?: string;
      keywords?: string[];
      brand?: string;
      subcategory?: string;
      price_min?: number;
      price_max?: number;
      attributes?: string[];
    } = {};

    try {
      const content = analysisCompletion.choices[0]?.message?.content;
      if (typeof content === 'string') {
        analysisResult = JSON.parse(content);
      }
    } catch (e) {
      // Bỏ qua nếu parse lỗi, dùng logic tìm kiếm cũ
    }

    let contextData = '';
    // Bước 2: Thu thập dữ liệu dựa trên kết quả phân tích
    if (analysisResult.intent === 'search_product') {
      const query: any = { limit: 5, page: 1 };

      // Xây dựng query tìm kiếm thông minh hơn
      const searchKeywords = [
        ...(analysisResult.keywords || []),
        ...(analysisResult.attributes || []),
      ].join(' ');

      if (searchKeywords) {
        query.search = searchKeywords;
      }

      // Tìm brandId nếu có
      if (analysisResult.brand) {
        try {
          const brandDoc = await this.brandsService.findAll({ q: analysisResult.brand, limit: 1 });
          if (brandDoc.items.length > 0) {
            query.brandId = brandDoc.items[0]._id.toString();
          }
        } catch (e) { /* Bỏ qua nếu không tìm thấy */ }
      }

      // Tìm subcategoryId nếu có
      if (analysisResult.subcategory) {
        try {
          const subcatDoc = await this.subcategoriesService.findAll({ search: analysisResult.subcategory, limit: 1 });
          if (subcatDoc.items.length > 0) {
            query.subcategoryId = subcatDoc.items[0]._id.toString();
          }
        } catch (e) { /* Bỏ qua nếu không tìm thấy */ }
      }

      // Thêm khoảng giá vào query (nếu có)
      // Lưu ý: productsService.findAll cần được cập nhật để hỗ trợ price_min, price_max
      // Hiện tại, chúng ta sẽ để AI tự lọc trong prompt

      const productsResult = await this.productsService.findAll(query);

      const productInfos = productsResult.items
        .map(p => {
          const price = p.priceFrom > 0 ? `${p.priceFrom.toLocaleString()} VND` : 'Chưa có giá';
          const specs = p.specs ? Object.entries(p.specs).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(', ') : 'Không có';
          return `- Tên: ${p.name}\n  Giá: ${price}\n  Thông số chính: ${specs}`;
        })
        .join('\n\n');

      if (productInfos) {
        contextData = `\n\nDữ liệu sản phẩm liên quan:\n${productInfos}`;
      } else {
        contextData = `\n\nKhông tìm thấy sản phẩm nào phù hợp.`;
      }
    } else {
      // Fallback cho các trường hợp không phải tìm sản phẩm hoặc phân tích lỗi
      // Bạn có thể thêm logic để trả lời về chính sách, chào hỏi... ở đây
    }

    // Bước 3: Tạo Prompt
    const prompt = `
      Bạn là một trợ lý bán hàng AI cho một cửa hàng thiết bị điện tử. Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng CHỈ DỰA VÀO thông tin được cung cấp trong phần "Dữ liệu sản phẩm liên quan".
      
      QUY TẮC BẮT BUỘC:
      1.  KHÔNG được sử dụng bất kỳ kiến thức nào bên ngoài.
      2.  Nếu "Dữ liệu sản phẩm liên quan" không chứa thông tin để trả lời câu hỏi, hãy trả lời một cách lịch sự rằng: "Xin lỗi, tôi không tìm thấy thông tin phù hợp với yêu cầu của bạn."
      3.  Không được bịa đặt thông tin, thông số kỹ thuật, hay giá cả.
      4.  Hãy trả lời một cách tự nhiên, thân thiện và tập trung vào việc giúp khách hàng.
      
      Câu hỏi của khách hàng: "${userMessage}"
      ${contextData}
      
    `;

    try {
      // Bước 4: Gọi API OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, // Tăng/giảm độ "sáng tạo" của câu trả lời
      });

      const reply = completion.choices[0]?.message?.content;
      return reply?.trim() ?? 'Xin lỗi, tôi không thể đưa ra câu trả lời lúc này.';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
    }
  }
}
