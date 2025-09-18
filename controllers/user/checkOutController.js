const mongoose = require('mongoose');
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')





const getCheckoutPage = async (req,res)=>{
const userID  = req.session.user._id
const cart = await Cart.findOne({ user: userID })
const userdetails = req.session.user
res.render('checkout',{
    cart,
    userdetails,
})
}


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










module.exports = {
    getCheckoutPage,
    checkoutAddress,

}