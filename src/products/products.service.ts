import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { ProductVariant } from '../product_variants/schemas/product-variant.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from '../product_variants/dto/create-product_variant.dto';
import { UpdateVariantDto } from '../product_variants/dto/update-product_variant.dto';
import { QueryProductsDto } from './dto/query-product.dto';

// Tối thiểu hoá AttributeTemplate để lấy rules
type AttrType = 'string' | 'number' | 'boolean' | 'enum' | 'multienum';
type AttributeDef = {
  key: string; type: AttrType; required?: boolean;
  options?: (string | number)[];
  min?: number; max?: number;
  filterable?: boolean;
};
type AttributeTemplate = {
  _id: Types.ObjectId;
  subcategoryId: Types.ObjectId;
  version: number;
  isActive: boolean;
  attributes: AttributeDef[];
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ProductVariant.name) private readonly variantModel: Model<ProductVariant>,
    // Template model — đổi tên theo module của bạn
    @InjectModel('AttributeTemplate') private readonly tmplModel: Model<AttributeTemplate>,
  ) { }

  private toId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  private slugify(input: string) {
    return input
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  /** Lấy template đang active theo subcategory */
  private async getActiveTemplate(subcategoryId: Types.ObjectId) {
    const tmpl = await this.tmplModel.findOne({ subcategoryId, isActive: true })
      .sort({ version: -1 })
      .lean();
    if (!tmpl) throw new BadRequestException('No active attribute template for this subcategory');
    return tmpl;
  }

  /** Validate attributes theo template + build facets (subset filterable) */
  private validateAndBuildFacets(attributes: Record<string, any>, tmpl: AttributeTemplate) {
    if (!attributes || typeof attributes !== 'object') {
      throw new BadRequestException('attributes must be an object');
    }
    const defs = tmpl.attributes || [];
    const defMap = new Map(defs.map(d => [d.key, d]));

    // check required
    for (const d of defs) {
      if (
        d.required &&
        (attributes[d.key] === undefined || attributes[d.key] === null || attributes[d.key] === '')
      ) {
        throw new BadRequestException(`Missing required attribute: ${d.key}`);
      }
    }

    // type & range & options
    for (const [k, v] of Object.entries(attributes)) {
      const d = defMap.get(k);
      if (!d) continue; // allow extra keys if muốn strict thì throw
      switch (d.type) {
        case 'number':
          if (typeof v !== 'number') throw new BadRequestException(`Attribute ${k} must be number`);
          if (d.min !== undefined && v < d.min) throw new BadRequestException(`${k} < min`);
          if (d.max !== undefined && v > d.max) throw new BadRequestException(`${k} > max`);
          break;
        case 'string':
          if (typeof v !== 'string') throw new BadRequestException(`Attribute ${k} must be string`);
          break;
        case 'boolean':
          if (typeof v !== 'boolean')
            throw new BadRequestException(`Attribute ${k} must be boolean`)
          break;
        case 'enum':
          if (!d.options?.includes(v))
            throw new BadRequestException(`Attribute ${k} must be in options`)
          break;
        case 'multienum':
          if (!Array.isArray(v)) throw new BadRequestException(`Attribute ${k} must be array`)
          for (const el of v)
            if (!d.options?.includes(el))
              throw new BadRequestException(`Attribute ${k} has invalid value`)
          break;
      }
    }

    // facets
    const facets: Record<string, any> = {};
    for (const d of defs) {
      if (d.filterable && attributes[d.key] !== undefined) {
        facets[d.key] = attributes[d.key]
      }
    }
    return facets;
  }

  /** Recompute price range & variant facet summary for product */
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
        if (Array.isArray(val)) val.forEach(x => s.add(x));
        else s.add(val);
      }
    }

    const variantFacetSummary: Record<string, any[]> = {};
    for (const [k, s] of set.entries()) variantFacetSummary[k] = Array.from(s);

    await this.productModel.updateOne(
      { _id: productId },
      { $set: { priceFrom, priceTo, variantFacetSummary } },
    );
  }

  // ---------------- Products ----------------

  async createProduct(dto: CreateProductDto) {
    const categoryId = this.toId(dto.categoryId);
    const subcategoryId = this.toId(dto.subcategoryId);
    const brandId = dto.brandId ? this.toId(dto.brandId) : undefined;

    const slug = dto.slug?.trim() || this.slugify(dto.name);
    const dup = await this.productModel.exists({ slug });
    if (dup) throw new BadRequestException('Slug already exists');

    // template active theo subcategory
    const tmpl = await this.getActiveTemplate(subcategoryId);

    const product = await this.productModel.create({
      name: dto.name.trim(),
      slug,
      categoryId,
      subcategoryId,
      brandId,
      specs: dto.specs ?? {},
      templateId: tmpl._id,
      templateVersion: tmpl.version,
      images: dto.images ?? [],
      thumbnail: dto.thumbnail,
      isPublished: dto.isPublished ?? false,
      priceFrom: dto.priceFrom ?? 0,
      priceTo: dto.priceTo ?? 0,
      variantFacetSummary: {},
    });

    return product.toObject();
  }

  async findAll(q: QueryProductsDto) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (q.search) {
      const s = q.search.trim();
      filter.$or = [{ name: { $regex: s, $options: 'i' } }, { slug: { $regex: s, $options: 'i' } }];
    }
    if (q.categoryId) filter.categoryId = this.toId(q.categoryId);
    if (q.subcategoryId) filter.subcategoryId = this.toId(q.subcategoryId);
    if (q.brandId) filter.brandId = this.toId(q.brandId);
    if (q.isPublished !== undefined) filter.isPublished = q.isPublished === 'true';

    const sort = q.sort === 'priceTo'
      ? { priceTo: 1 }
      : q.sort === 'priceFrom'
        ? { priceFrom: 1 }
          : { createdAt: -1 } // Default sort

    const [items, total] = await Promise.all([
      this.productModel.find(filter).sort(sort as any).skip(skip).limit(limit).lean(),
      this.productModel.countDocuments(filter),
    ]);

    return { items, page, limit, total, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const doc = await this.productModel.findById(this.toId(id)).lean();
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const _id = this.toId(id);
    const current = await this.productModel.findById(_id);
    if (!current) throw new NotFoundException('Product not found');

    const update: any = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.slug !== undefined) {
      const slug = dto.slug.trim() || this.slugify(dto.name ?? '');
      const dup = await this.productModel.exists({ _id: { $ne: _id }, slug });
      if (dup) throw new BadRequestException('Slug already exists');
      update.slug = slug;
    }
    if (dto.categoryId) update.categoryId = this.toId(dto.categoryId);
    if (dto.subcategoryId) update.subcategoryId = this.toId(dto.subcategoryId);
    if (dto.brandId) update.brandId = this.toId(dto.brandId);
    if (dto.specs !== undefined) update.specs = dto.specs;
    if (dto.images !== undefined) update.images = dto.images;
    if (dto.thumbnail !== undefined) update.thumbnail = dto.thumbnail;
    if (dto.isPublished !== undefined) update.isPublished = dto.isPublished;

    // Nếu đổi subcategory -> cập nhật template mới (active)
    if (dto.subcategoryId) {
      const tmpl = await this.getActiveTemplate(this.toId(dto.subcategoryId));
      update.templateId = tmpl._id;
      update.templateVersion = tmpl.version;
    }

    const saved = await this.productModel.findByIdAndUpdate(_id, { $set: update }, { new: true }).lean();
    return saved!;
  }

  async removeHard(id: string) {
    const _id = this.toId(id);
    // xoá variants trước
    await this.variantModel.deleteMany({ productId: _id });
    const res = await this.productModel.deleteOne({ _id });
    if (res.deletedCount === 0) throw new NotFoundException('Product not found');
    return { ok: true };
  }

  // ---------------- Variants ----------------

  async createVariant(productId: string, dto: CreateVariantDto) {
    const pid = this.toId(productId);
    const product = await this.productModel.findById(pid).lean();
    if (!product) throw new NotFoundException('Product not found');

    // Lấy template theo product.templateId hoặc active theo subcategory
    const tmpl = await this.tmplModel.findById(product.templateId).lean()
      || await this.getActiveTemplate(product.subcategoryId);

    const facets = this.validateAndBuildFacets(dto.attributes, tmpl);

    const variant = await this.variantModel.create({
      productId: pid,
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

    // Nếu product chưa có thumbnail, mượn ảnh của variant
    if (!product.thumbnail && (dto.images?.length || product.images?.length)) {
      await this.productModel.updateOne(
        { _id: pid },
        { $set: { thumbnail: dto.images?.[0] || product.images?.[0] } },
      );
    }

    await this.recomputeAggregates(pid);
    return variant.toObject();
  }

  async listVariants(productId: string) {
    const pid = this.toId(productId);
    return this.variantModel.find({ productId: pid, isActive: true }).lean();
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateVariantDto) {
    const pid = this.toId(productId);
    const vid = this.toId(variantId);

    const product = await this.productModel.findById(pid).lean();
    if (!product) throw new NotFoundException('Product not found');

    const current = await this.variantModel.findOne({ _id: vid, productId: pid });
    if (!current) throw new NotFoundException('Variant not found');

    const update: any = {};
    if (dto.sku !== undefined) update.sku = dto.sku;
    if (dto.barcode !== undefined) update.barcode = dto.barcode;
    if (dto.attributes !== undefined) {
      const tmpl = await this.tmplModel.findById(product.templateId).lean()
        || await this.getActiveTemplate(product.subcategoryId);
      update.attributes = dto.attributes;
      update.facets = this.validateAndBuildFacets(dto.attributes, tmpl);
    }
    if (dto.price !== undefined) update.price = dto.price;
    if (dto.compareAtPrice !== undefined) update.compareAtPrice = dto.compareAtPrice;
    if (dto.stock !== undefined) update.stock = dto.stock;
    if (dto.images !== undefined) update.images = dto.images;

    const saved = await this.variantModel
      .findByIdAndUpdate(vid, { $set: update }, { new: true })
      .lean();

    await this.recomputeAggregates(pid);
    return saved!;
  }

  async removeVariant(productId: string, variantId: string) {
    const pid = this.toId(productId);
    const vid = this.toId(variantId);

    const res = await this.variantModel.deleteOne({ _id: vid, productId: pid });
    if (res.deletedCount === 0) throw new NotFoundException('Variant not found');

    await this.recomputeAggregates(pid);
    return { ok: true };
  }
}
