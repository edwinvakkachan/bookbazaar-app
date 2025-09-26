const express = require('express')
const router = express.Router();
const userController = require('../controllers/user/userController');
const cartController = require('../controllers/user/cartController')
const checkOutController = require('../controllers/user/checkOutController');
const orderController = require('../controllers/user/orderController')
const homeController = require('../controllers/user/homeController')
const shopController = require('../controllers/user/shopController')
const wishlistCOntroller = require('../controllers/user/wishlistController')
const passport = require('passport');
const {userAuth,adminAuth} = require('../middlewares/auth')



router.get('/pageNotFound',userController.pageNotFound)

router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOTP);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));

router.get("/google/callback",passport.authenticate("google", {failureRedirect: "/login?blocked=true",}),(req, res) => {req.session.user = req.user; res.redirect("/");});



router.get('/login',userController.loadLogin);
router.post('/login',userController.login);
router.get('/logout',userController.logout);
router.get('/about',userController.about)
router.get('/contact',userController.contact)
router.post("/contact", userController.sendContact)

router.get('/forgotPassword',userController.loadForgotPassword)
router.post('/forgotPassword',userController.forgotPasswordSendOtp)
router.get('/resetPassword',userController.loadResetPassword)
router.post('/resetPassword',userController.resetPassword)
router.post('/forgotPassword/resend', userController.resendForgotOtp);

//homePage

router.get('/',userController.loadHomepage);
router.get('/api/categories/popular',homeController.loadCategories)
router.get('/api/products/bestselling',homeController.bestselling)
router.get('/api/products/latest',homeController.latest)



//product page
router.get('/shop',userAuth, shopController.loadshoppingPage);
router.get('/book/:id',userAuth,shopController.getBookDetails);
router.get('/api/products', shopController.apiGetProducts);
router.get('/api/categories', shopController.apiGetCategories);
router.get('/api/brands', shopController.apiGetBrands);

//userProfile

router.get('/userProfile',userAuth,userController.getUserProfile)
router.get('/userProfile/edit', userAuth, userController.getEditProfile);
router.post('/userProfile/edit', userAuth, userController.postEditProfile);

//orders
router.get('/orders',userAuth,orderController.listOrders)
router.get('/orders/:orderId',userAuth,orderController.viewOrder)
router.post('/orders/:orderId/cancel',userAuth,orderController.cancelOrder)
router.post('/orders/:orderId/return',userAuth,orderController.returnItem)
router.get('/orders/:orderId/invoice',userAuth,orderController.downloadInvoice)



//address management
router.get('/addresses',userAuth,userController.getAddress);
router.get('/address/add', userAuth,userController.getAddAddress );
router.post('/address/add', userAuth, userController.addAddress);
router.get('/address/edit/:addressId', userAuth, userController.getEditAddress);
router.post('/address/edit/:addressId', userAuth, userController.editAddress);
router.post('/address/delete/:addressId', userAuth, userController.deleteAddress);
router.post('/address/setPrimary/:addressId', userAuth, userController.setPrimary);



// userRoute.js — add under /userProfile routes
router.post('/userProfile/requestEmailChange', userAuth, userController.requestEmailChange);
router.post('/userProfile/verifyEmailOtp', userAuth, userController.verifyEmailOtp);
router.post('/userProfile/resendEmailOtp', userAuth, userController.resendEmailOtp);




//whishlist
router.get('/wishlist',userAuth,wishlistCOntroller.getWishlist)
router.post('/wishlist/add',userAuth,wishlistCOntroller.addToWishlist)
router.post('/wishlist/remove/:productId',userAuth,wishlistCOntroller.removeFromWishlist)



//cartManagement
router.post('/cart/:add', userAuth, cartController.addToCart);               
router.get('/cart', userAuth, cartController.listCart);                    
router.post('/api/cart/delete/:productId', userAuth, cartController.removeFromCart);
router.post('/api/cart/:productId/quantity', userAuth, cartController.changeQuantity); 






//checkOut page
router.get('/checkout',userAuth,checkOutController.getCheckoutPage);
router.post('/checkout',userAuth,orderController.createShowConforamtion)
router.post('/checkout/address/add', userAuth, checkOutController.checkoutAddress);







//testing
router.get('/test',userController.test)




module.exports = router;