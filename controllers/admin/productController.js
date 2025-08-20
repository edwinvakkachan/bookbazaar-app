const Product = require('../../models/productSchema');
const Category  = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');



const getproductAddPage = async (req,res)=>{
    try {
        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false});
        res.render('productAdd',{
            cat:category,
            brand:brand,
        })
    } catch (error) {
        console.error('product page load error',error)
    }
}



const addProducts = async (req,res)=>{
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName:products.productName
        })
       
        if(!productExists){
 
 const files = req.files;
    let imagePaths = [];

    for (let i = 0; i < files.length; i++) {
      if (!files[i].buffer) continue;

      const filename = Date.now() + "-" + i + ".png";
      const filepath = path.join("public","uploads","productImages", filename);

       try {
          await sharp(files[i].buffer)
            .resize(500, 500, { fit: "cover" })
            .toFile(filepath);

          imagePaths.push("/uploads/productImages/" + filename);
          console.log("✅ Saved:", filepath);
        } catch (error) {
          console.error("❌ Sharp failed for file:", files[i].originalname, error);
        }
    }
            const categoryId = await Category.findOne({name:products.category});
            if(!categoryId){
                console.log('category id not exist') //update: pass the error for frontend
                 return res.redirect('/admin/addProducts');
            } 
            const newProduct = new Product({
                productName:products.productName,
                description:products.description,
                brand:products.brand,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                createdOn:new Date(),
                quantity:products.quantity,
                size:products.size,
                color:products.color,
                productImage:imagePaths,
                status:'Available',
            });
            await newProduct.save();
           return res.redirect('/admin/addProducts');

        }else {
            console.log('products already exists with same name')
            return res.redirect('/admin/addProducts');
        }
        
    } catch (error) {
        console.error('product add error',error);
        return res.redirect('/admin/addProducts');
    }
}


const getAllProducts = async (req,res)=>{
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit =4;

        const productData = await Product.find({
            $or:[
                {productName:{$regex: new RegExp(".*"+search+".*","i")}},
                {brand:{$regex: new RegExp(".*"+search+".*","i")}}
            ],
        }).limit(limit*1).skip((page-1)*limit).populate('category').exec();

        const count = await Product.find({
            $or:[
                {productName:{$regex: new RegExp(".*"+search+".*","i")}},
                {brand:{$regex: new RegExp(".*"+search+".*","i")}}
            ],
        }).countDocuments();


        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false})

        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                totalPages:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
                brand:brand,
            })
        }else {
            console.log('product list error')
        }


    } catch (error) {
        console.error('get all product error',error)
    }
}

module.exports = {
    getproductAddPage,
    addProducts,
    getAllProducts,
}