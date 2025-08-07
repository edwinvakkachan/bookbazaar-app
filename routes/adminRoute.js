const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');




router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout);

//userManagement
router.get('/customers',adminAuth,customerController.customerInfo);
router.post('/blockUser/:id', customerController.blockUser);
router.post('/unblockUser/:id', customerController.unblockUser);

//categoryManagement
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',categoryController.addCategory)







module.exports = router;