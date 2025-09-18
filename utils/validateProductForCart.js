

const Product = require('../models/productSchema');   
const Category = require('../models/categorySchema'); 
const Brand = require('../models/brandSchema');       

async function validateProductForCart(productId) {
 
  const product = await Product.findById(productId)
    .populate({ path: 'category', select: 'name isBlocked isListed' })
    .populate({ path: 'brand', select: 'name isBlocked isListed' });


  if (!product) {
    const e = new Error('Product not found');
    e.status = 404;
    throw e;
  }

  
  if (product.isBlocked === true) {
    const e = new Error('Product is blocked by admin');
    e.status = 403;
    throw e;
  }

  

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
  
  if (product.brand) {
    if (product.brand.isBlocked === true) {
      const e = new Error('Product brand is blocked');
      e.status = 403;
      throw e;
    }
    
    if (product.brand.isListed === false) {
      const e = new Error('Product brand is not listed');
      e.status = 403;
      throw e;
    }
  }

  
  if ((product.quantity || 0) <= 0) {
    const e = new Error('Product out of stock');
    e.status = 400;
    throw e;
  }


  product.brandName = product.brand ? product.brand.brandName : undefined;
  product.brandIsBlocked = product.brand ? !!product.brand.isBlocked : false;
   product.brandIsListed = product.brand ? (product.brand.isListed !== false) : true;
  product.categoryName = product.category ? product.category.name : undefined;

  return product;
}

module.exports = validateProductForCart;
