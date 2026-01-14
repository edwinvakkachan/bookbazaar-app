const mongoose = require('mongoose');
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const Brand = require('../../models/brandSchema');
const Category = require('../../models/categorySchema')







const checkoutAddress = async (req, res) => {
  try {
    
    const userId = req.session.user._id;
    

    const {
      label = 'Home',
      name,
      email,
      phone,
      line1,
      line2 = '',
      city = '',
      state = '',
      postalCode = '',
      country = 'India',
      isPrimary = false
    } = req.body;

    if (!name || !line1) {
      return res.status(400).json({ message: 'Name and address line are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    
    if (isPrimary) {
      user.addresses.forEach(a => a.isPrimary = false);
    }

    
    const addr = {
      label,
      name,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
      phone,
      isPrimary: !!isPrimary,
      createdAt: new Date()
    };

    user.addresses.push(addr);
    await user.save();

    
    const newAddr = user.addresses[user.addresses.length - 1];

    
    return res.json(newAddr);

  } catch (err) {
    console.error('error in adding address in checkout', err);
    return res.status(500).json({ message: 'Server error while saving address' });
  }
};


const getCheckoutPage = async (req, res) => {
  const userID = req.session.user._id;

  
  const allowedBrands = await Brand.find({ isBlocked: false }).select('_id').lean();
  const allowedCategories = await Category.find({ isListed: true }).select('_id').lean();

  
  const cart = await Cart.findOne({ user: userID }).lean();
  if (!cart || !cart.items || cart.items.length === 0) {
    return res.render('checkout', { cart: { items: [] }, userdetails: req.session.user });
  }

  
  const productIds = cart.items.map(it => it.product);

  
  const allowedProducts = await Product.find({
    _id: { $in: productIds },
    isBlocked: false,
    brand: { $in: allowedBrands.map(b => b._id) },
    category: { $in: allowedCategories.map(c => c._id) },
    quantity: { $gt: 0 },
    status: 'Available'
  }).select('_id').lean();

  
  const allowedSet = new Set(allowedProducts.map(p => p._id.toString()));

  
  const filteredItems = cart.items.filter(it => allowedSet.has(it.product.toString()));

 
  const cleanedCartForRender = { ...cart, items: filteredItems };

  res.render('checkout', {
    cart: cleanedCartForRender,
    userdetails: req.session.user
  });
};








module.exports = {
    getCheckoutPage,
    checkoutAddress,

}