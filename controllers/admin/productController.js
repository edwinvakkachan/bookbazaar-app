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

        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})

        res.render('productAdd',{
            cat:category,
            brand:brand,
            admin:adminEmail,
            activePage:'addProduct',
            search:'',
            // category:categoryData,
        })
    } catch (error) {
        console.error('product page load error',error)
    }
}



const addProducts = async (req,res)=>{
    try {

        console.log("Reached addProducts controller");
console.log("req.body:", req.body);
console.log("req.files:", req.files);

        const products = req.body;
        console.log(products)
        const productExists = await Product.findOne({
            productName:products.productName
        })
       
        if(!productExists){
 
 const files = req.files;
 console.log(files)


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
          console.log(" image Saved:", filepath);
        } catch (error) {
          console.error(" Sharp failed for file:", files[i].originalname, error);
        }
    }
            const categoryId = await Category.findOne({name:products.category});
            if(!categoryId){
                console.log('category id not exist') 
                 return res.redirect('/admin/addProducts');
            } 
            const newProduct = new Product({
                productName:products.productName,
                description:products.description,
                longDescription: products.longDescription, 
                brand:products.brand,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                createdOn:new Date(),
                quantity:products.quantity,
                size:products.size,
                author: products.author,


                
      pages: products.pages,
      language: products.language,
      isbn: products.isbn,

      
      benefits: products.benefits ? products.benefits.split(",").map(b => b.trim()) : [],


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
    $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
    ]
})
.sort({ createdAt: -1 }) 
.limit(limit * 1)
.skip((page - 1) * limit)
.populate('category')
.exec();


        const count = await Product.find({
            $or:[
                {productName:{$regex: new RegExp(".*"+search+".*","i")}},
                {brand:{$regex: new RegExp(".*"+search+".*","i")}}
            ],
        }).countDocuments();


        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false})

        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})
        

        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                //totalPages:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
                brand:brand,
                admin:adminEmail,
                activePage:'products',
                search,
                // category:productData,
            })
        }else {
            console.log('product list error')
        }


    } catch (error) {
        console.error('get all product error',error)
    }
}

const blockProdcut = async (req,res)=>{
    try {
        let id = req.query.id;
        console.log('id is: ',id);
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/products')

    } catch (error) {
        console.error("product block error",error)
    }
}

const unblockProdcut = async (req,res)=>{
    try {
        let id = req.query.id;
        console.log('id is: ',id);
        await Product.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/products')

    } catch (error) {
        console.error("product unblock error",error)
    }
}




module.exports = {
    getproductAddPage,
    addProducts,
    getAllProducts,
    blockProdcut,
    unblockProdcut,
}


