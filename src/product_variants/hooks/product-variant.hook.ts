// // product-variant.hooks.ts
// import { ProductVariant } from '@product_variants/schemas/product-variant.schema';
// import { Product } from '@products/schemas/product.schema';

// ProductVariantSchema.post(['save', 'remove'], async function (doc: ProductVariant) {
//   const model = doc.constructor as any;
//   const productModel = model.db.model<Product>('Product');

//   const variants = await model.find({ productId: doc.productId, isActive: true });
//   if (!variants.length) {
//     await productModel.findByIdAndUpdate(doc.productId, {
//       priceFrom: 0,
//       priceTo: 0,
//       variantFacetSummary: {},
//     });
//     return;
//   }

//   const prices = variants.map(v => v.price);
//   const summary = {
//     colors: [...new Set(variants.map(v => v.facets?.color).filter(Boolean))],
//     storage_set: [...new Set(variants.map(v => v.facets?.storage).filter(Boolean))],
//     ram_set: [...new Set(variants.map(v => v.facets?.ram).filter(Boolean))],
//   };

//   await productModel.findByIdAndUpdate(doc.productId, {
//     priceFrom: Math.min(...prices),
//     priceTo: Math.max(...prices),
//     variantFacetSummary: summary,
//   });
// });
