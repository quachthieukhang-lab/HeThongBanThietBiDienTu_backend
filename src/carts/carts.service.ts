import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './schemas/cart.schema';

// OPTIONAL: nếu có schema Product / ProductVariant, import ra để lấy snapshot
import { Product } from '../products/schemas/product.schema';
import { ProductVariant } from '../product_variants/schemas/product-variant.schema'

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('ProductVariant') private readonly variantModel: Model<ProductVariant>,
  ) {}

  private toId(id?: string) {
    if (!id) return undefined;
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  private recomputeTotals(cart: Cart) {
    const items = cart.items || [];
    cart.totalQuantity = items.reduce((s, it) => s + (it.quantity || 0), 0);
    cart.totalPrice = items.reduce((s, it) => s + (it.quantity * it.price || 0), 0);
  }
  private async loadSnapshot(productId: Types.ObjectId, variantId?: Types.ObjectId) {
    if (variantId) {
      const variant = await this.variantModel.findOne({ _id: variantId, productId }).lean();
      if (!variant) throw new NotFoundException('Variant not found');
      const product = await this.productModel.findById(productId).lean();
      if (!product) throw new NotFoundException('Product not found');

      return {
        name: product.name,
        thumbnail: variant.images?.[0] || product.thumbnail,
        price: variant.price ?? product.priceFrom ?? 0,
        facets: variant.facets,
      };
    } else {
      const product = await this.productModel.findById(productId).lean();
      if (!product) throw new NotFoundException('Product not found');
      return {
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.priceFrom ?? 0,
        facets: product.facets,
      };
    }
  }
  public async findOrCreateActiveCart(userId?: Types.ObjectId, sessionId?: string) {
    const filter: any = { status: 'active' };
    if (userId) filter.userId = userId;
    else if (sessionId) filter.sessionId = sessionId;
    else throw new BadRequestException('Missing userId or sessionId');

    let cart = await this.cartModel.findOne(filter);
    if (!cart) {
      cart = await this.cartModel.create({ ...filter, items: [], totalPrice: 0, totalQuantity: 0 });
    }
    return cart;
  }

  /**
   * Load snapshot từ product/variant
   * Nếu chưa có schema, thay bằng mock (name/thumbnail/price) hoặc lấy từ một service khác.
   */
  

  /** GET /carts/me?sessionId=... (nếu có auth: lấy userId từ req.user) */
  async getMyCart(userId?: string, sessionId?: string) {
    const uid = this.toId(userId);
    const filter: any = { status: 'active' };
    if (uid) filter.userId = uid
    else if (sessionId) filter.sessionId = sessionId
    else throw new BadRequestException('Missing userId or sessionId');
    const cart = await this.cartModel.findOne(filter).lean();
    return (
      cart ?? {
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
        status: 'active',
        userId: uid,
        sessionId,
      }
    )
  }

  /** POST /carts/items (thêm/merge) */
  async addItem(payload: {
    userId?: string
    sessionId?: string
    productId: string
    variantId?: string
    quantity: number
  }) {
    const uid = this.toId(payload.userId);
    const pid = this.toId(payload.productId)!;
    const vid = this.toId(payload.variantId);

    if (!payload.quantity || payload.quantity < 1) {
      throw new BadRequestException('Quantity must be >= 1');
    }

    const cart = await this.findOrCreateActiveCart(uid, payload.sessionId);

    // Tìm item cùng khoá productId + variantId
    const key = (it: any) =>
      it.productId.equals(pid) && String(it.variantId || '') === String(vid || '')
    const idx = cart.items.findIndex(key);

    if (idx >= 0) {
      cart.items[idx].quantity += payload.quantity;
    } else {
      const snap = await this.loadSnapshot(pid, vid);
      cart.items.push({
        productId: pid,
        variantId: vid,
        name: snap.name,
        thumbnail: snap.thumbnail,
        price: snap.price,
        quantity: payload.quantity,
        facets: snap.facets,
      } as any);
    }

    this.recomputeTotals(cart);
    await cart.save();
    return cart.toObject();
  }

  /** PATCH /carts/items (set số lượng; =0 thì xoá) */
  async setItemQty(payload: {
    userId?: string
    sessionId?: string
    productId: string
    variantId?: string
    quantity: number
  }) {
    const uid = this.toId(payload.userId);
    const pid = this.toId(payload.productId)!;
    const vid = this.toId(payload.variantId);
    if (payload.quantity < 0) throw new BadRequestException('Quantity must be >= 0');

    const cart = await this.findOrCreateActiveCart(uid, payload.sessionId);
    const idx = cart.items.findIndex(
      (it) => it.productId.equals(pid) && String(it.variantId || '') === String(vid || ''),
    )

    if (idx < 0) throw new NotFoundException('Item not found in cart');

    if (payload.quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = payload.quantity;
    }

    this.recomputeTotals(cart);
    await cart.save();
    return cart.toObject();
  }

  /** DELETE /carts/items */
  async removeItem(payload: {
    userId?: string
    sessionId?: string
    productId: string
    variantId?: string
  }) {
    const uid = this.toId(payload.userId);
    const pid = this.toId(payload.productId)!;
    const vid = this.toId(payload.variantId);

    const cart = await this.findOrCreateActiveCart(uid, payload.sessionId);
    const before = cart.items.length;
    cart.items = cart.items.filter(
      (it) => !(it.productId.equals(pid) && String(it.variantId || '') === String(vid || '')),
    )

    if (before === cart.items.length) throw new NotFoundException('Item not found in cart');

    this.recomputeTotals(cart);
    await cart.save();
    return cart.toObject();
  }

  /** POST /carts/clear */
  async clearCart(userId?: string, sessionId?: string) {
    const uid = this.toId(userId);
    const cart = await this.findOrCreateActiveCart(uid, sessionId);
    cart.items = [];
    this.recomputeTotals(cart);
    await cart.save();
    return cart.toObject();
  }

  /** POST /carts/merge (guest -> user) */
  async mergeGuestToUser(sessionId: string, userId: string) {
    const uid = this.toId(userId)!;

    const guest = await this.cartModel.findOne({ sessionId, status: 'active' });
    const user = await this.findOrCreateActiveCart(uid, undefined);

    if (guest && guest.items.length) {
      // merge items
      for (const gi of guest.items) {
        const idx = user.items.findIndex(
          (ui) =>
            ui.productId.equals(gi.productId) &&
            String(ui.variantId || '') === String(gi.variantId || ''),
        )
        if (idx >= 0) {
          user.items[idx].quantity += gi.quantity;
        } else {
          user.items.push(gi as any);
        }
      }
      this.recomputeTotals(user);
      await user.save();
      // mark guest cart abandoned
      guest.status = 'abandoned';
      await guest.save();
    }

    return { merged: true, targetCartId: user._id, sourceCartId: guest?._id ?? null };
  }
}