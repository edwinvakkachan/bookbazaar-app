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











module.exports = {getCheckoutPage}