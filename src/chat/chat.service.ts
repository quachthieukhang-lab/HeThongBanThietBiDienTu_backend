import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';  // KHÔNG dùng @openrouter/sdk nữa
import { CreateChatDto } from './dto/create-chat.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ChatService {
  private client: OpenAI;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService, // Inject ProductsService
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1', // QUAN TRỌNG
    });
  }

  async chat(dto: CreateChatDto, userId: string) {
    let contextData = 'Không tìm thấy thông tin sản phẩm phù hợp trong hệ thống.';
    try {
      // Sử dụng phương thức search đã có trong ProductsService
      
      const products = await this.productsService.search({ keyword: dto.message });

      if (products && products.length > 0) {
        // Chuyển đổi dữ liệu sản phẩm thành dạng text để AI có thể đọc
        contextData = `Tìm thấy ${products.length} sản phẩm liên quan:\n` +
          products
            .map(p => {
              // Ép kiểu `as any` để truy cập các trường đã được populate mà không bị lỗi TypeScript
              const brandName = (p.brandId as any)?.name || 'Chưa xác định';
              const categoryName = (p.categoryId as any)?.name || 'Chưa xác định';
              const subcategoryName = (p.subcategoryId as any)?.name || 'Chưa xác định';
              const servicePackages = (p.servicePackageIds as any[])?.map(sp => sp.name).join(', ') || 'Không có';

              return `- Tên: ${p.name}\n` +
                     `  - Giá từ: ${p.priceFrom.toLocaleString('vi-VN')} VNĐ\n` +
                     `  - Thương hiệu: ${brandName}\n` +
                     `  - Danh mục: ${categoryName} > ${subcategoryName}\n` +
                     `  - Gói dịch vụ đi kèm: ${servicePackages}`;
            })
            .join('\n');
      }
      this.logger.log(`Context for AI: ${contextData}`);
    } catch (dbError) {
      this.logger.error('Failed to retrieve data from database', dbError);
      // Không ném lỗi, vẫn tiếp tục để AI có thể trả lời chung chung
    }

    // --- BƯỚC 2: XÂY DỰNG PROMPT VÀ GỌI AI ---
    const systemPrompt = `Bạn là trợ lý ảo bán hàng chuyên nghiệp và thân thiện của một cửa hàng thiết bị điện tử.
NGUYÊN TẮC VÀNG:
1.  CHỈ được phép trả lời dựa trên thông tin trong phần "DỮ LIỆU HỆ THỐNG CUNG CẤP".
2.  Nếu "DỮ LIỆU HỆ THỐNG CUNG CẤP" báo không tìm thấy, hãy lịch sự xin lỗi, nói rằng bạn chưa tìm thấy sản phẩm và gợi 
ý khách hàng cung cấp từ khóa khác rõ ràng hơn (ví dụ: "laptop gaming" thay vì "máy tính"). TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm.
3.  Khi trả lời, hãy tư vấn như một người bán hàng: giới thiệu ngắn gọn sản phẩm tìm thấy, nhấn mạnh vào giá hoặc thương hiệu và mời khách hàng xem xét.
4.  Sử dụng ngôn ngữ tiếng Việt tự nhiên, vui vẻ, có thể dùng emoji phù hợp (💻, 📱, 🛒).

--- DỮ LIỆU HỆ THỐNG CUNG CẤP ---
${contextData}
--- KẾT THÚC DỮ LIỆU ---`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Câu hỏi của tôi là: "${dto.message}"` },
        ],
      });

      const choice = completion.choices[0];

      return {
        response: choice.message?.content || "",
        usage: completion.usage,
      };

    } catch (error) {
      this.logger.error("OpenRouter API Error:", error);
      throw new InternalServerErrorException("Failed to communicate with AI service");
    }
  }
}
