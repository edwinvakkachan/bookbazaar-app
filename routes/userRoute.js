const express = require('express')
const router = express.Router();
const userController = require('../controllers/user/userController');
const cartController = require('../controllers/user/cartController')
const checkOutController = require('../controllers/user/checkOutController');
const orderController = require('../controllers/user/orderController')
const passport = require('passport');
const {userAuth,adminAuth} = require('../middlewares/auth')



router.get('/pageNotFound',userController.pageNotFound)
router.get('/',userController.loadHomepage);
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

//product page
router.get('/shop',userAuth, userController.loadshoppingPage);
router.get('/filter',userController.filterProduct);
router.get('/book/:id',userAuth,userController.getBookDetails);

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



//whishlist
router.get('/wishlist',userAuth,userController.getWishlist)
router.post('/wishlist/add',userAuth,userController.addToWishlist)
router.get('/wishlist/remove/:productId',userAuth,userController.removeFromWishlist)



//cartManagement
router.post('/cart/:add', userAuth, cartController.addToCart);               
router.get('/cart', userAuth, cartController.listCart);                    
router.post('/api/cart/delete/:productId', userAuth, cartController.removeFromCart);
router.post('/api/cart/:productId/quantity', userAuth, cartController.changeQuantity); 




//checkOut page
router.get('/checkout',userAuth,checkOutController.getCheckoutPage);
router.post('/checkout',userAuth,orderController.createShowConforamtion)





//testing
router.get('/test',userController.test)




module.exports = router;