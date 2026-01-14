const User = require("../../models/userSchema");
const Wishlist = require("../../models/whishlistSchema");
const Product  = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user._id; 

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId required' });
    }

    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
      const count = await Wishlist.countDocuments({ userId });
      return res.json({ success: true, message: 'Already in wishlist', wishlistCount: count });
    }

    await Wishlist.create({ userId, productId });
   const count = await Wishlist.countDocuments({ userId });

    res.json({ success: true, message: 'Added to wishlist', wishlistCount:count });
  } catch (err) {
    console.error(err);
     res.status(500).json({ success: false, message: 'Server error' });
  }
};




const removeFromWishlist = async (req, res) => {
  try {

    const {productId} =  req.body
    
      if (!productId) {
      return res.status(400).json({ success: false, message: 'productId required' });
    }
    const userId = req.session.user._id;

    await Wishlist.deleteOne({ userId, productId });
     const wishlistCount = await Wishlist.countDocuments({ userId });

    res.json({ success: true, message: 'Removed from wishlist', wishlistCount });
   
  } catch (err) {
    console.error(err);
     res.status(500).json({ success: false, message: 'Could not remove item' });
  }
};




const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const items = await Wishlist.find({ userId })
  .populate({
    path: 'productId',
    populate: [
      { path: 'brand', select: 'brandName isBlocked' },   
      { path: 'category', select: 'name isListed' }       
    ]
  });


 const wishlistProductIds = items
  .map(it => it.productId)
  .filter(Boolean)
  .filter(p =>
    !p.isBlocked &&                     
    p.brand && !p.brand.isBlocked &&    
    p.category && p.category.isListed   
  )
  .map(p => p._id); 

    let recommendations = await Product.aggregate([
      { $match: { _id: { $nin: wishlistProductIds } } },
         { $sample: { size: 4 } }
       ]);
 
    
    const count = await Wishlist.countDocuments({userId:userId})

    res.json({
      success: true,
      items,
       recommendations,
      wishlistCount:count,

    });
  } catch (error) {
    console.error('getWishlist error:', error);
    res.status(500).json({ success: false, message: 'Unable to load wishlist' });
  }
};


const getWishlistPage = async (req,res)=>{
  res.render('wishlist')
}

module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    getWishlistPage,
}