const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController')
const brandController = require('../controllers/admin/brandController')
const  orderController = require('../controllers/admin/orderController')
const upload = require('../helpers/multer');



router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.post('/logout',adminController.logout);

// customers
router.get('/customers',adminAuth,customerController.getCustomerPage)
router.get('/api/customers',adminAuth,customerController.getCustomersApi)
router.patch('/blockUser', adminAuth, customerController.blockUser);
router.patch('/unblockUser',adminAuth, customerController.unblockUser);

//categoryManagement
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.patch('/listCategory',adminAuth,categoryController.getListCategory)
router.patch('/unlistCategory',adminAuth,categoryController.getUnlistCategory)
router.get('/geteditCategory',adminAuth,categoryController.geteditCategory)
router.post('/editCategory',adminAuth,categoryController.editCategory)

//brandMangement
router.get('/brands',adminAuth,brandController.getBrandPage);
router.post('/addBrand',adminAuth,upload.single("image"),brandController.addBrand);
router.post('/blockBrand',adminAuth,brandController.blockBrand);
router.post('/unblockBrand',adminAuth,brandController.unblockBrand)
router.delete('/deleteBrand',adminAuth,brandController.deleteBrand)

//productMangement
router.get('/addProducts',adminAuth,productController.getproductAddPage)
router.post('/addProducts',adminAuth,upload.array("images",4),productController.addProducts)
router.get('/products',adminAuth,productController.getAllProducts)
router.post('/blockProduct',adminAuth,productController.blockProdcut)
router.post('/unblockProduct',adminAuth,productController.unblockProdcut)
router.get("/editProduct/:id", adminAuth, productController.editProductPage);
router.post("/editProduct/:id", upload.any(), adminAuth, productController.updateProduct);


//orderMangement
router.get('/orders',adminAuth, orderController.listOrders);
router.get('/orders/:id',adminAuth, orderController.viewOrder);
router.put('/orders/:id/status',adminAuth, orderController.updateStatus);



router.get('/test',categoryController.test)



module.exports = router;