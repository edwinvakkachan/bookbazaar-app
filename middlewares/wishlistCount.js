const wishlistCount = async(req,res,next)=>{
    if (req.session.user) {
    const userId = req.session.user._id;
    const Wishlist = require('../models/whishlistSchema');
    const wishlistCount = await Wishlist.countDocuments({ userId });
    res.locals.wishlistCount = wishlistCount;
  } else {
    res.locals.wishlistCount = 0;
  }
  next();
}

module.exports = wishlistCount