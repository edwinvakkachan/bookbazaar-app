const mongoose = require('mongoose');
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')






const getCheckoutPage = async (req,res)=>{
const userID  = req.session.user._id
const cart = await Cart.findOne({ user: userID })
const userdetails = req.session.user
// console.log('your cart is ',cart)
// console.log('user id id',userID);
res.render('checkout',{
    cart,
    userdetails,
})
}







module.exports = {getCheckoutPage}