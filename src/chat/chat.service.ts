// src/chat/chat.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { BrandsService } from '../brands/brands.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Định nghĩa kiểu dữ liệu trả về từ AI để dễ xử lý
interface AnalysisResult {
  intent: 'search_product' | 'ask_policy' | 'greeting' | 'other';
  keywords: string[];
  brand?: string;
  subcategory?: string;
  price_min?: number;
  price_max?: number;
  attributes?: string[];
}

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly subcategoriesService: SubcategoriesService,
    private readonly brandsService: BrandsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not defined. Please set it in your .env file.');
      throw new Error('GEMINI_API_KEY is not defined. Please set it in your .env file.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(userMessage: string): Promise<string> {
    // --- BƯỚC 1: PHÂN TÍCH Ý ĐỊNH (Intent Detection) ---
    
    // Sử dụng model Flash cho tốc độ nhanh
    const analysisModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.1, // Thấp để đảm bảo tính chính xác
        responseMimeType: 'application/json', // QUAN TRỌNG: Ép kiểu trả về là JSON
      },
    });

    const analysisPrompt = `
      Bạn là một chuyên gia phân tích ngôn ngữ cho hệ thống thương mại điện tử.
      Nhiệm vụ: Phân tích tin nhắn người dùng và trích xuất thông tin cấu trúc JSON.
      
      Tin nhắn: "${userMessage}"

      Yêu cầu đầu ra JSON mẫu:
      {
        "intent": "search_product" (hoặc "ask_policy", "greeting", "other"),
        "keywords": ["từ khóa 1", "từ khóa 2"],
        "brand": "Tên thương hiệu (nếu có)",
        "subcategory": "Danh mục (ví dụ: Điện thoại, Laptop)",
        "price_min": số_nguyên (nếu có),
        "price_max": số_nguyên (nếu có),
        "attributes": ["màu sắc", "cấu hình"]
      }
    `;

    let analysisResult: AnalysisResult = { intent: 'other', keywords: [] };

    try {
      const result = await analysisModel.generateContent(analysisPrompt);
      const response = await result.response;
      // Vì đã set responseMimeType là json, ta có thể parse trực tiếp an toàn hơn
      analysisResult = JSON.parse(response.text());
      this.logger.log(`User Intent: ${JSON.stringify(analysisResult)}`);
    } catch (e) {
      this.logger.error('Error analyzing intent:', e);
      // Fallback nếu lỗi phân tích
      analysisResult.intent = 'search_product'; 
      analysisResult.keywords = [userMessage];
    }

    // --- BƯỚC 2: TRUY VẤN DỮ LIỆU (Data Retrieval) ---
    
    let contextData = '';

    if (analysisResult.intent === 'search_product') {
      const query: any = { limit: 5, page: 1 };

      // Xử lý từ khóa tìm kiếm
      const keywords = Array.isArray(analysisResult.keywords) ? analysisResult.keywords : [];
      const attributes = Array.isArray(analysisResult.attributes) ? analysisResult.attributes : [];
      
      // Thêm brand vào chuỗi tìm kiếm chung thay vì cố gắng lọc theo ID
      const brandKeyword = analysisResult.brand ? [analysisResult.brand] : [];
      const searchString = [...keywords, ...attributes, ...brandKeyword].join(' ').trim();

      if (searchString) query.search = searchString;

      // Tạm thời vô hiệu hóa việc tìm ID thương hiệu vì QueryBrandDto không hỗ trợ tìm kiếm
      // Nếu sau này QueryBrandDto được cập nhật, bạn có thể mở lại phần này.

      // Tìm ID danh mục con
      if (analysisResult.subcategory) {
        try {
          // DTO mong đợi thuộc tính 'search' để tìm kiếm, không phải 'name'
          const subcatDoc = await this.subcategoriesService.findAll({ search: analysisResult.subcategory, limit: 1 });
          if (subcatDoc.items && subcatDoc.items.length > 0) {
            query.subcategoryId = subcatDoc.items[0]._id.toString();
          }
        } catch (e) {
            this.logger.warn(`Subcategory not found: ${analysisResult.subcategory}`);
        }
      }

      // TODO: Nếu ProductsService hỗ trợ lọc giá, hãy thêm vào query
      // if (analysisResult.price_min) query.minPrice = analysisResult.price_min;
      // if (analysisResult.price_max) query.maxPrice = analysisResult.price_max;

      // Gọi service lấy sản phẩm
      try {
        const productsResult = await this.productsService.findAll(query);
        
        if (productsResult.items.length > 0) {
          const productInfos = productsResult.items
            .map(p => {
              const price = p.priceFrom ? p.priceFrom.toLocaleString('vi-VN') + ' đ' : 'Liên hệ';
              // Format specs gọn gàng hơn
              let specsStr = '';
              if (p.specs) {
                 specsStr = Object.entries(p.specs)
                    .slice(0, 4) // Lấy 4 thông số đầu tiên
                    .map(([k, v]) => `${k}: ${v}`).join(', ');
              }
              return `- Sản phẩm: ${p.name}\n  Giá: ${price}\n  Thông số: ${specsStr}`;
            })
            .join('\n\n');
            
          contextData = `Dữ liệu sản phẩm tìm thấy trong kho:\n${productInfos}`;
        } else {
          contextData = `Không tìm thấy sản phẩm nào khớp với từ khóa "${searchString}" hoặc các bộ lọc thương hiệu/danh mục đã chọn.`;
        }
      } catch (error) {
        contextData = `Lỗi khi truy vấn cơ sở dữ liệu sản phẩm.`;
      }
    } 
    
    // --- BƯỚC 3: TẠO CÂU TRẢ LỜI (Response Generation) ---

    const chatModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite', // Dùng Flash để phản hồi nhanh
    });

    const finalPrompt = `
      Bạn là trợ lý ảo bán hàng chuyên nghiệp, thân thiện.
      
      NGUYÊN TẮC:
      1. Chỉ trả lời dựa trên thông tin trong phần "CONTEXT DATA" bên dưới.
      2. Nếu không có thông tin trong Context, hãy xin lỗi và gợi ý khách hàng cung cấp thêm chi tiết. KHÔNG bịa đặt thông tin.
      3. Nếu tìm thấy sản phẩm, hãy giới thiệu ngắn gọn, nhấn mạnh điểm nổi bật và mời khách xem chi tiết hoặc mua hàng.
      4. Sử dụng tiếng Việt tự nhiên, có emoji phù hợp 🛒📱.

      CÂU HỎI CỦA KHÁCH: "${userMessage}"
      
      CONTEXT DATA (KẾT QUẢ TÌM KIẾM):
      ${contextData}
    `;

    try {
      const result = await chatModel.generateContent(finalPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error generating chat response:', error);
      return 'Xin lỗi, hiện tại tôi đang gặp chút trục trặc. Bạn vui lòng thử lại sau nhé! 😓';
    }
  }
}