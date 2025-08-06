const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController');

//files to be deleted







//files above deleted



router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout);


router.get('/customers',adminAuth,customerController.customerInfo);







module.exports = router;