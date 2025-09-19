const Product = require('../../models/productSchema');
const Category  = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose')



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
          
        } catch (error) {
          console.error(" Sharp failed for file:", files[i].originalname, error);
        }
    }
            const categoryId = await Category.findOne({name:products.category});
            if(!categoryId){
                console.log('category id not exist') 
                 return res.redirect('/admin/addProducts');
            } 

            const brandId = await Brand.findOne({ brandName: products.brand });
                if (!brandId) {
                console.log("brand id not exist");
                return res.redirect("/admin/addProducts");
                }


            const newProduct = new Product({
                productName:products.productName,
                description:products.description,
                longDescription: products.longDescription, 
                brand: brandId._id, 
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
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

         
        const matchedBrands = await Brand.find({
            brandName: { $regex: new RegExp(".*" + search + ".*", "i") }
        }).select("_id");

        
        const productQuery = {
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $in: matchedBrands.map(b => b._id) } }
            ]
        };

        
        const productData = await Product.find(productQuery)
            .populate("category", "name")
            .populate("brand", "brandName")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

     
        const count = await Product.countDocuments(productQuery);

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });

        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData, { email: 1 });

        if (category && brand) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
                admin: adminEmail,
                activePage: "products",
                search
            });
        } else {
            console.log("product list error");
        }
    } catch (error) {
        console.error("get all product error", error);
    }
};


const blockProdcut = async (req,res)=>{
    try {
        let id = req.query.id;
        
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/products')

    } catch (error) {
        console.error("product block error",error)
    }
}

const unblockProdcut = async (req,res)=>{
    try {
        let id = req.query.id;
        
        await Product.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/products')

    } catch (error) {
        console.error("product unblock error",error)
    }
}



const editProductPage = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId) .populate("category", "name")
  .populate("brand", "brandName");

  
    if (!product) {
      return res.redirect("/admin/products");
    }


        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})

    


    const categories = await Category.find({ isListed: true });
const brands = await Brand.find({ isBlocked: false });

    res.render("productEdit", {
      product,
      categories,
      admin:adminEmail,
       activePage:'products',
       brands,
    //    search,
      
    });
  } catch (err) {
    console.error("Error loading edit product page:", err);
    res.redirect("/admin/products");
  }
};


const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const data = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.redirect("/admin/products");
    }

    
    let imagePaths = [...(product.productImage || Array(4).fill(null))];

   
    const removeSlots = Array.isArray(req.body.removeImages) 
      ? req.body.removeImages.map(Number) 
      : req.body.removeImages 
        ? [Number(req.body.removeImages)] 
        : [];

    removeSlots.forEach(idx => {
      if (imagePaths[idx]) {
        imagePaths[idx] = null; 
      }
    });





if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    if (!file.buffer) continue;

  
    const match = file.fieldname.match(/images\[(\d+)\]/);
    if (!match) continue;
    const slotIndex = parseInt(match[1], 10);

    const filename = Date.now() + "-" + slotIndex + ".png";
    const filepath = path.join("public", "uploads", "productImages", filename);

    await sharp(file.buffer)
      .resize(500, 500, { fit: "cover" })
      .toFile(filepath);

    imagePaths[slotIndex] = "/uploads/productImages/" + filename;
  }
}


    
    imagePaths = imagePaths.filter(img => img !== null);

    const benefitsArray = data.benefits
      ? data.benefits.split(",").map(b => b.trim())
      : [];

    const categoryId = await Category.findOne({ name: data.category });
    if (!categoryId) {
      console.log("Category not found");
      return res.redirect("/admin/products");
    }

    await Product.findByIdAndUpdate(productId, {
      productName: data.productName,
      description: data.description,
      longDescription: data.longDescription,
      
      brand: new mongoose.Types.ObjectId(data.brand),
      author: data.author,
      category: categoryId._id,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      quantity: data.quantity,
      pages: data.pages,
      language: data.language,
      isbn: data.isbn,
      benefits: benefitsArray,
      productImage: imagePaths
    });






    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.redirect("/admin/products");
  }
};




module.exports = {
    getproductAddPage,
    addProducts,
    getAllProducts,
    blockProdcut,
    unblockProdcut,
    editProductPage,
    updateProduct,
}


