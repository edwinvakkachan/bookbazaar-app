const Brand = require('../../models/brandSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const { broadcast } = require('../../utils/sse');//
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
    const {brandName} = req.body
    
     const normalizedBrandName = brandName.trim().toLowerCase();
    const findBrand = await Brand.findOne({brandName:{ $regex: new RegExp(`^${normalizedBrandName}$`, "i")}});
    if(findBrand){
       return  res.json({success:false,message:'brand name already exists'})
    }
    if (!findBrand) {
      let filename = null;

      if (req.file) {
       
        filename = `brand-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
        
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

      console.log(brandName,filename)

      const newBrand = new Brand({
        brandName,
        brandImage: filename, 
      });

      await newBrand.save();
    }
 res.json({success:true})

  } catch (error) {
    console.error("add brand error", error);
    res.json({success:false,message:'internal server error'})
  }
}


const blockBrand = async (req,res)=>{
    try {
        const {brandId}  = req.body
             await Brand.findByIdAndUpdate(brandId,{isBlocked:true})
            res.json({success:true})
    } catch (error) {
        console.error('brand block error',error)
        res.json({success:false,message:'Failed to block Brand'})
    }
}

const unblockBrand = async (req,res)=>{
    try {
        const {brandId} = req.body
        await Brand.findByIdAndUpdate(brandId,{isBlocked:false});
        res.json({success:true})
    } catch (error) {
        console.error('brand unblock error',error);
        res.json({success:false,message:'Failed to unBlock the Brand'})
    }
}
const deleteBrand = async (req,res)=>{
    try {
        const {brandId} = req.body;
        await Brand.findByIdAndDelete(brandId)
        res.json({success:true});
    } catch (error) {
        console.error('brand delete errro',error);
        res.json({success:false,message:'failed to delete the brand'})
    }
}



module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand,

}

