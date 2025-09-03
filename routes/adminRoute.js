const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController')
const brandController = require('../controllers/admin/brandController')


// const multer = require('multer');
// const storage = require('../helpers/multer')
// const uploads = multer({storage:storage});

const upload = require('../helpers/multer');
//console.log('multer export keys:', Object.keys(upload));


router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.post('/logout',adminController.logout);

//userManagement
router.get('/customers',adminAuth,customerController.customerInfo);
router.post('/blockUser/:id', customerController.blockUser);
router.post('/unblockUser/:id', customerController.unblockUser);

//categoryManagement
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.get('/listCategory',adminAuth,categoryController.getListCategory)
router.get('/unlistCategory',adminAuth,categoryController.getUnlistCategory)
router.get('/geteditCategory',adminAuth,categoryController.geteditCategory)
router.post('/editCategory/:id',adminAuth,categoryController.editCategory)

//brandMangement
router.get('/brands',adminAuth,brandController.getBrandPage);
router.post('/addBrand',adminAuth,upload.single("image"),brandController.addBrand);
router.get('/blockBrand',adminAuth,brandController.blockBrand);
router.get('/unblockBrand',adminAuth,brandController.unblockBrand)
router.get('/deleteBrand',adminAuth,brandController.deleteBrand)

//productMangement
router.get('/addProducts',adminAuth,productController.getproductAddPage)
router.post('/addProducts',adminAuth,upload.array("images",4),productController.addProducts)
router.get('/products',adminAuth,productController.getAllProducts)
router.get('/blockProduct',adminAuth,productController.blockProdcut)
router.get('/unblockProduct',adminAuth,productController.unblockProdcut)


router.get('/test',categoryController.test)



module.exports = router;