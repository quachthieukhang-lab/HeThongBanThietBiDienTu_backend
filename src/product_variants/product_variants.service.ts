import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductVariant } from './schemas/product-variant.schema';
import { CreateVariantDto } from './dto/create-product_variant.dto';
import { UpdateVariantDto } from './dto/update-product_variant.dto';
import { QueryVariantsDto } from './dto/query-product_variant.dto';
import { Product } from '../products/schemas/product.schema';

// Tối giản template
type AttrType = 'string' | 'number' | 'boolean' | 'enum' | 'multienum';
type AttributeDef = {
  key: string; type: AttrType; required?: boolean;
  options?: (string|number)[]; min?: number; max?: number; filterable?: boolean;
};
type AttributeTemplate = {
  _id: Types.ObjectId; subcategoryId: Types.ObjectId;
  version: number; isActive: boolean; attributes: AttributeDef[];
};

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel(ProductVariant.name) private readonly variantModel: Model<ProductVariant>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel('AttributeTemplate') private readonly tmplModel: Model<AttributeTemplate>,
  ) {}

  private toId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  private async getTemplateForProduct(productId: Types.ObjectId) {
    const product = await this.productModel.findById(productId).lean();
    if (!product) throw new NotFoundException('Product not found');
    // ưu tiên template từ product (đã chốt khi tạo)
    const tmpl = await this.tmplModel.findById(product.templateId).lean();
    if (!tmpl) throw new BadRequestException('Attribute template not found for this product');
    return { product, tmpl };
  }

  private validateAndBuildFacets(attributes: Record<string, any>, tmpl: AttributeTemplate) {
    if (!attributes || typeof attributes !== 'object') {
      throw new BadRequestException('attributes must be an object');
    }
    const defs = tmpl.attributes || [];
    const defMap = new Map(defs.map(d => [d.key, d]));

    // required
    for (const d of defs) {
      if (d.required && (attributes[d.key] === undefined || attributes[d.key] === null || attributes[d.key] === '')) {
        throw new BadRequestException(`Missing required attribute: ${d.key}`);
      }
    }

    // type/constraints
    for (const [k, v] of Object.entries(attributes)) {
      const d = defMap.get(k);
      if (!d) continue; // nếu muốn strict: throw new BadRequestException(`Unknown attribute: ${k}`);
      switch (d.type) {
        case 'number':
          if (typeof v !== 'number') throw new BadRequestException(`${k} must be number`);
          if (d.min !== undefined && v < d.min) throw new BadRequestException(`${k} < min`);
          if (d.max !== undefined && v > d.max) throw new BadRequestException(`${k} > max`);
          break;
        case 'string':
          if (typeof v !== 'string') throw new BadRequestException(`${k} must be string`);
          break;
        case 'boolean':
          if (typeof v !== 'boolean') throw new BadRequestException(`${k} must be boolean`);
          break;
        case 'enum':
          if (!d.options?.includes(v)) throw new BadRequestException(`${k} not in options`);
          break;
        case 'multienum':
          if (!Array.isArray(v)) throw new BadRequestException(`${k} must be array`);
          for (const el of v) if (!d.options?.includes(el)) throw new BadRequestException(`${k} has invalid value`);
          break;
      }
    }

    // facets
    const facets: Record<string, any> = {};
    for (const d of defs) {
      if (d.filterable && attributes[d.key] !== undefined) {
        facets[d.key] = attributes[d.key];
      }
    }
    return facets;
  }

  private async recomputeAggregates(productId: Types.ObjectId) {
    const variants = await this.variantModel.find({ productId, isActive: true }).lean();
    let priceFrom = 0, priceTo = 0;
    const set = new Map<string, Set<any>>();

    for (const v of variants) {
      const p = v.price || 0;
      if (priceFrom === 0 || p < priceFrom) priceFrom = p;
      if (p > priceTo) priceTo = p;

      const f = v.facets || {};
      for (const [k, val] of Object.entries(f)) {
        if (!set.has(k)) set.set(k, new Set());
        const s = set.get(k)!;
        Array.isArray(val) ? val.forEach(x => s.add(x)) : s.add(val);
      }
    }

    const summary: Record<string, any[]> = {};
    for (const [k, s] of set.entries()) summary[k] = Array.from(s);

    await this.productModel.updateOne(
      { _id: productId },
      { $set: { priceFrom, priceTo, variantFacetSummary: summary } },
    );
  }

  // -------- CRUD --------

  async create(dto: CreateVariantDto) {
    const productId = this.toId(dto.productId);
    const { product, tmpl } = await this.getTemplateForProduct(productId);
    const facets = this.validateAndBuildFacets(dto.attributes, tmpl);

    const created = await this.variantModel.create({
      productId,
      sku: dto.sku,
      barcode: dto.barcode,
      attributes: dto.attributes,
      facets,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      stock: dto.stock,
      images: dto.images ?? [],
      isActive: true,
    });

    // Nếu product chưa có thumbnail thì mượn từ variant
    if (!product.thumbnail && (dto.images?.length || product.images?.length)) {
      await this.productModel.updateOne(
        { _id: productId },
        { $set: { thumbnail: dto.images?.[0] || product.images?.[0] } },
      );
    }

    await this.recomputeAggregates(productId);
    return created.toObject();
  }

  async findAll(q: QueryVariantsDto) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (q.productId) filter.productId = this.toId(q.productId);
    if (q.search) {
      const s = q.search.trim();
      filter.$or = [{ sku: { $regex: s, $options: 'i' } }, { barcode: { $regex: s, $options: 'i' } }];
    }
    if (q.isActive !== undefined) filter.isActive = q.isActive === 'true';

    const sort =
      q.sort === 'price' ? { price: 1 } :
      q.sort === '-price' ? { price: -1 } :
      q.sort === 'sku' ? { sku: 1 } :
      { createdAt: -1 };

    const [items, total] = await Promise.all([
      this.variantModel.find(filter).sort(sort as any).skip(skip).limit(limit).lean(),
      this.variantModel.countDocuments(filter),
    ]);

    return { items, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const vid = this.toId(id);
    const doc = await this.variantModel.findById(vid).lean();
    if (!doc) throw new NotFoundException('Variant not found');
    return doc;
  }

  async update(id: string, dto: UpdateVariantDto) {
    const vid = this.toId(id);
    const current = await this.variantModel.findById(vid);
    if (!current) throw new NotFoundException('Variant not found');

    const update: any = {};
    if (dto.productId) update.productId = this.toId(dto.productId);
    if (dto.sku !== undefined) update.sku = dto.sku;
    if (dto.barcode !== undefined) update.barcode = dto.barcode;
    if (dto.attributes !== undefined) {
      const { tmpl } = await this.getTemplateForProduct((update.productId ?? current.productId) as Types.ObjectId);
      update.attributes = dto.attributes;
      update.facets = this.validateAndBuildFacets(dto.attributes, tmpl);
    }
    if (dto.price !== undefined) update.price = dto.price;
    if (dto.compareAtPrice !== undefined) update.compareAtPrice = dto.compareAtPrice;
    if (dto.stock !== undefined) update.stock = dto.stock;
    if (dto.images !== undefined) update.images = dto.images;

    const saved = await this.variantModel.findByIdAndUpdate(vid, { $set: update }, { new: true }).lean();

    await this.recomputeAggregates((saved!.productId as Types.ObjectId));
    return saved!;
  }

  async setActive(id: string, isActive: boolean) {
    const vid = this.toId(id);
    const doc = await this.variantModel.findByIdAndUpdate(vid, { $set: { isActive } }, { new: true }).lean();
    if (!doc) throw new NotFoundException('Variant not found');
    await this.recomputeAggregates((doc.productId as Types.ObjectId));
    return doc;
  }

  async adjustStock(id: string, delta: number) {
    const vid = this.toId(id);
    const updated = await this.variantModel.findByIdAndUpdate(
      vid,
      { $inc: { stock: delta } },
      { new: true },
    ).lean();
    if (!updated) throw new NotFoundException('Variant not found');
    return updated;
  }

  async remove(id: string) {
    const vid = this.toId(id);
    const found = await this.variantModel.findById(vid).lean();
    if (!found) throw new NotFoundException('Variant not found');

    await this.variantModel.deleteOne({ _id: vid });
    await this.recomputeAggregates((found.productId as Types.ObjectId));
    return { ok: true };
  }
}
