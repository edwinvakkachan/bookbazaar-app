const Brand = require('../../models/brandSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const fs = require('fs')
const path = require("path");


const getBrandPage = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;
        const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands/limit) 

        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})

        res.render('brands',{
            data:brandData,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands,
            admin:adminEmail,
            activePage:'brands',
            category:brandData,
        })
        
    } catch (error) {
        console.error('error in getBrandPage',error) //error handling meddileware important 
    }
}


const addBrand = async (req,res)=>{
    try {
    const brand = req.body.name.trim();
    // Check if brand already exists
    const findBrand = await Brand.findOne({ brandName: brand });
    if (!findBrand) {
      let filename = null;

      if (req.file) {
        // Generate unique filename
        filename = `brand-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
        // Absolute path to save file in /public/uploads/reimage
        const uploadPath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          "uploads",
          "reimage",
          filename
        );
        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });


        fs.writeFileSync(uploadPath, req.file.buffer);
      }

      const newBrand = new Brand({
        brandName: brand,
        brandImage: filename, 
      });

      await newBrand.save();
    }

    res.redirect("/admin/brands");
  } catch (error) {
    console.error("add brand error", error);
    res.status(500).send("Error adding brand");
  }
}

const blockBrand = async (req,res)=>{
    try {
        const id  = req.query.id
             await Brand.findByIdAndUpdate(id,{$set:{isBlocked:true}})
            res.redirect('/admin/brands');
    } catch (error) {
        console.error('brand block error',error)
    }
}

const unblockBrand = async (req,res)=>{
    try {
        const id = req.query.id
        await Brand.findByIdAndUpdate(id,{$set:{isBlocked:false}});
        res.redirect('/admin/brands')
    } catch (error) {
        console.error('brand unblock error',error)
    }
}

const deleteBrand = async (req,res)=>{
    try {
        const id = req.query.id;
        await Brand.findByIdAndDelete(id)
        res.redirect('/admin/brands')
    } catch (error) {
        console.error('brand delete errro',error)
    }
}



module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand,

}

