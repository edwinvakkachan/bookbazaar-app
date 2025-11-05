
const Cart = require('../models/cartSchema'); 

const cartCountMiddleware = async (req, res, next) =>{
  try {
    let count = 0;

    if (req.session.user && req.session.user._id) {
      const cart = await Cart.findOne({ user: req.session.user._id }).select('items').lean();
      if (cart && Array.isArray(cart.items)) {
        
        count = cart.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
      }
    } else {
      
      const sessionCart = req.session?.cart || [];
      if (Array.isArray(sessionCart)) count = sessionCart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }

    res.locals.cartCount = count; 
    next();
  } catch (err) {
    console.error('cartCountMiddleware error:', err);
    res.locals.cartCount = 0;
    next();
  }
};



module.exports =  cartCountMiddleware



