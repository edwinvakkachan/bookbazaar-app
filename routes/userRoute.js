const express = require('express')
const router = express.Router();
const userController = require('../controllers/user/userController');
const passport = require('passport');
const {userAuth,adminAuth} = require('../middlewares/auth')


router.get('/pageNotFound',userController.pageNotFound)
router.get('/',userController.loadHomepage);
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOTP);
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{ res.redirect('/')})
router.get('/login',userController.loadLogin);
router.post('/login',userController.login);
router.get('/logout',userController.logout);

router.get('/forgotPassword',userController.loadForgotPassword)
router.post('/forgotPassword',userController.forgotPasswordSendOtp)
router.get('/resetPassword',userController.loadResetPassword)
router.post('/resetPassword',userController.resetPassword)
router.post('/forgotPassword/resend', userController.resendForgotOtp);

//product page
router.get('/shop',userAuth, userController.loadshoppingPage);
router.get('/filter',userController.filterProduct);



router.get('/book/:id',userController.getBookDetails);


//testing

router.get('/test',userController.test)




module.exports = router;