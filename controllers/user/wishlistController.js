const User = require("../../models/userSchema");
const Wishlist = require("../../models/whishlistSchema");
const Product  = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user._id; 

    
    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
       return res.redirect('/wishlist');
    }

    await Wishlist.create({ userId, productId });
    res.redirect("/wishlist");
  } catch (err) {
    console.error(err);
    res.render("wishlist", { error: "Something went wrong" });
  }
};




const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.user._id;

    await Wishlist.deleteOne({ userId, productId });
    res.redirect("/wishlist");
  } catch (err) {
    console.error(err);
    res.render("wishlist", { error: "Could not remove item" });
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

      
      const productBlocked = !!p.isBlocked;
      const categoryBlocked = !!(cat && cat.isListed === false);

      const brandBlocked = !!(br && br.isBlocked);

      p.isOutOfStock = productBlocked || categoryBlocked || brandBlocked;
      
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

    res.render('wishlist', {
      items,
      recommendations,
      user: req.session.user,
      cartCount: req.session.cart ? req.session.cart.length : 0
    });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.render('wishlist', {
      items: [],
      recommendations: [],
      error: 'Unable to load wishlist',
      user: req.session.user,
      cartCount: req.session.cart ? req.session.cart.length : 0
    });
  }
};

module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
}