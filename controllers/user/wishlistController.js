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
   const wishlistCount = await Wishlist.countDocuments({ userId });

    res.json({ success: true, message: 'Added to wishlist', wishlistCount });
  } catch (err) {
    console.error(err);
     res.status(500).json({ success: false, message: 'Server error' });
  }
};




const removeFromWishlist = async (req, res) => {
  try {
    console.log('prodcut removed')
    const { productId } = req.params;
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

    const items = await Wishlist.find({ userId }).populate('productId');

    const categoryIds = new Set();
    const brandIds = new Set();
    items.forEach(it => {
      const p = it.productId || {};
      if (p.category) categoryIds.add(String(p.category));
      if (p.brand) brandIds.add(String(p.brand));
    });

    const categories = await Category.find({ _id: { $in: Array.from(categoryIds) } }).lean();
    const brands = await Brand.find({ _id: { $in: Array.from(brandIds) } }).lean();

    const categoryMap = {};
    categories.forEach(c => { categoryMap[String(c._id)] = c; });
    const brandMap = {};
    brands.forEach(b => { brandMap[String(b._id)] = b; });

    items.forEach(it => {
      const p = it.productId;
      if (!p) return;
      const cat = p.category ? categoryMap[String(p.category)] : null;
      const br = p.brand ? brandMap[String(p.brand)] : null;
      p.isOutOfStock = !!p.isBlocked || !!(cat && cat.isListed === false) || !!(br && br.isBlocked);
    });

    const wishlistProductIds = items
      .map(it => it.productId && it.productId._id)
      .filter(Boolean);

    let recommendations;
    if (wishlistProductIds.length === 0) {
      recommendations = await Product.aggregate([{ $sample: { size: 4 } }]);
    } else {
      recommendations = await Product.aggregate([
        { $match: { _id: { $nin: wishlistProductIds } } },
        { $sample: { size: 4 } }
      ]);
    }

    res.json({
      success: true,
      items,
      recommendations
    });
  } catch (err) {
    console.error('getWishlist error:', err);
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