const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Wishlist = require('../../models/whishlistSchema'); 
const validateProductForCart = require('../../utils/validateProductForCart');
const { DEFAULT_MAX_PER_ORDER } = require('../../config/cartSettings');
const mongoose = require('mongoose');
const whishlistSchema = require('../../models/whishlistSchema');





const safeNumber = v => (typeof v === 'number' ? v : (parseInt(v, 10) || 0));




const listCart = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: [
        { path: 'brand', select: 'brandName isBlocked' },   
        { path: 'category', select: 'name isListed' }
      ]
    });

    if (!cart) {
      return res.render('cart', { items: [], total: 0, cartBottomImageUrl: null });
    }

    const items = cart.items.map(it => {
      const p = it.product || {};
      const title = p.productName || 'Unknown Product';
      const image = p.productImage?.[0] || '/images/placeholder.png';

      
      const price = safeNumber(p.salePrice);

      
      const stock = safeNumber(p.quantity);

      const outOfStock =
        !p ||
        stock <= 0 ||
        p.isBlocked === true ||
        (p.category && p.category.isListed === false) ||
        (p.brand && p.brand.isBlocked === true);

      const productMax =
        typeof p.maxPerOrder === 'number' && p.maxPerOrder > 0
          ? p.maxPerOrder
          : DEFAULT_MAX_PER_ORDER;

      return {
        product: p,
        title,
        image,
        qty: it.qty,
        priceAtAdd: price,
        outOfStock,
        stock,
        productMax
      };
    });

    const total =
      typeof cart.getSubtotal === 'function'
        ? cart.getSubtotal()
        : cart.items.reduce(
            (s, it) => s + safeNumber(it.priceAtAdd) * safeNumber(it.qty),
            0
          );

    return res.render('cart', { items, total, cartBottomImageUrl: null });
  } catch (err) {
    console.error('listCart error', err);
    return res.status(500).json({ error: 'Server error in listcart' });
  }
};




const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId, qty = 1 } = req.body;

 
    const quantityRequested = Math.max(1, parseInt(qty, 10) || 1);

   
    const product = await validateProductForCart(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

   
    const stock = safeNumber(product.quantity);
    if (stock <= 0) return res.status(400).json({ error: 'Product out of stock' });

    
    const productMax =  DEFAULT_MAX_PER_ORDER;

    
    const addQty = Math.min(quantityRequested, productMax, stock);

    
    const imageUrl = product.productImage?.[0] || '';

    
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      
      cart = new Cart({ user: userId, items: [] });
    }

   
    const idx = cart.items.findIndex(it => it.product.toString() === product._id.toString());
    if (idx >= 0) {
      
      const newQty = Math.min(cart.items[idx].qty + addQty, productMax, stock);
      cart.items[idx].qty = newQty;
      
    } else {
      
      cart.items.push({
        product: product._id,
        title: product.productName || product.title || '',
        sku: product.sku || '',
        image: imageUrl,
        priceAtAdd: safeNumber(product.salePrice || product.regularPrice || product.price),
        qty: addQty,
        maxPerOrderAtAdd: product.maxPerOrder || null
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    
    await Wishlist.deleteOne({ userId: userId, productId: product._id }).catch(()=>{});

    
    return res.redirect('/cart');
  } catch (err) {
    console.error('addToCart error', err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Server error' });
  }
};


const changeQuantity = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.params;
    const { action, qty } = req.body;
//  console.log('.........................')
//     console.log('the qty',qty,' action',action)
//      console.log('.........................')

   

    const product = await Product.findById(productId);
    
    if (product.isBlocked === true) return res.status(403).json({ error: 'Product blocked' });

    
    const available = safeNumber(product.quantity );
    if (available <= 0) return res.status(400).json({ error: 'Product out of stock' });

   
const productMax = DEFAULT_MAX_PER_ORDER;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const idx = cart.items.findIndex(it => it.product.toString() === productId);
    if (idx < 0) return res.status(404).json({ error: 'Product not in cart' });

    let newQty = cart.items[idx].qty;
    if (action === 'inc') newQty = newQty + 1;
    else if (action === 'dec') newQty = newQty - 1;
    else if (qty !== undefined) newQty = parseInt(qty, 10);

    if (newQty < 1) {
      cart.items.splice(idx, 1);
    } else {
      if (newQty > productMax) newQty = productMax;
      if (newQty > available) {
        return res.status(400).json({ error: `Only ${available} items available` });
      }
      cart.items[idx].qty = newQty;
    }

    cart.updatedAt = new Date();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    return res.json({ success: true, cart: populated });
  } catch (err) {
    console.error('changeQuantity error', err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Server error' });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(it => it.product.toString() !== productId);
    cart.updatedAt = new Date();
    await cart.save();
    return res.json({ success: true,cart });
  } catch (err) {
    console.error('removeFromCart error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};






module.exports = {
  addToCart,
  listCart,
  removeFromCart,
  changeQuantity
};