// utils/validateProductForCart.js
// Validates product, category and brand according to your rules:
// - if product.isBlocked === true => blocked
// - if category.isListed === false => blocked/unlisted
// - if brand.isBlocked === true => blocked
//
// Returns the populated product document when OK, otherwise throws { status, message } Error.

const Product = require('../models/productSchema');   // adjust path if needed
const Category = require('../models/categorySchema'); // adjust path if needed
const Brand = require('../models/brandSchema');       // adjust path if needed

async function validateProductForCart(productId) {
  // load product and populate category + brand minimal fields needed for checks
  const product = await Product.findById(productId)
    .populate({ path: 'category', select: 'name isBlocked isListed' })
    .populate({ path: 'brand', select: 'name isBlocked isListed' });


// console.log('-----------------------------------------')
//     console.log('my product is',product);
//     console.log('-----------------------------------------')




  if (!product) {
    const e = new Error('Product not found');
    e.status = 404;
    throw e;
  }

  // PRODUCT-level block check (your rule: admin block sets product.isBlocked = true)
  if (product.isBlocked === true) {
    const e = new Error('Product is blocked by admin');
    e.status = 403;
    throw e;
  }

  // If your product schema has an isListed flag and you want to treat false as unlisted,
  // you can uncomment the next lines. (You told me only product.isBlocked is used for product)
  // if (product.isListed === false) {
  //   const e = new Error('Product is not listed');
  //   e.status = 403;
  //   throw e;
  // }

  // CATEGORY-level check (your rule: when admin blocks category => category.isListed = false)
  if (!product.category) {
    const e = new Error('Product category not found');
    e.status = 403;
    throw e;
  }
  if (product.category.isListed === false) {
    const e = new Error('Product category is blocked / unlisted');
    e.status = 403;
    throw e;
  }
  // if category has an isBlocked flag and you want to check it as well, you can:
  // if (product.category.isBlocked === true) { ... }

  // BRAND-level check (your rule: when admin blocks brand => brand.isBlocked = true)
  if (product.brand) {
    if (product.brand.isBlocked === true) {
      const e = new Error('Product brand is blocked');
      e.status = 403;
      throw e;
    }
    // optionally check brand.isListed === false if you use that flag too
    if (product.brand.isListed === false) {
      const e = new Error('Product brand is not listed');
      e.status = 403;
      throw e;
    }
  }

  // Optional: stock check before adding to cart (recommended)
  if ((product.quantity || 0) <= 0) {
    const e = new Error('Product out of stock');
    e.status = 400;
    throw e;
  }

  // Attach convenience fields for cart snapshots (optional)
//   product.brandName = product.brand ? product.brand.name : undefined;
//   product.brandIsBlocked = product.brand ? !!product.brand.isBlocked : false;
//   product.brandIsListed = product.brand ? (product.brand.isListed !== false) : true;
//   product.categoryName = product.category ? product.category.name : undefined;
  product.brandName = product.brand ? product.brand.brandName : undefined;
  product.brandIsBlocked = product.brand ? !!product.brand.isBlocked : false;
   product.brandIsListed = product.brand ? (product.brand.isListed !== false) : true;
  product.categoryName = product.category ? product.category.name : undefined;

  return product;
}

module.exports = validateProductForCart;
