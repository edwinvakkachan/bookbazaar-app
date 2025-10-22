const Category = require('../../models/categorySchema')
const User = require('../../models/userSchema')
const { broadcast } = require('../../utils/sse');


const categoryInfo = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
         
        const limit = 4;
        const skip = (page-1)*limit;
        const categoryData = await Category.find({})
        .sort({createdAt:-1}) //change here for sorting 
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories/limit);


        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})


        res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            admin:adminEmail,
            activePage:'category',
            search:'',
            category:categoryData,
        });
    } catch (error) {
        console.error('categeoryInfo controller error',error);
         return res.status(500).json({error:'internal server error'});

        
    }
}

const addCategory =  async (req,res)=>{
    try {
        const {name,description} = req.body;
        
        const normalizedName = name.trim().toLowerCase();
    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${normalizedName}$`, "i") }
    });
        if(existingCategory){
            return res.status(400).json({error:'Category alredy exists'})
        }
        const newCategory = new Category({
            name,
            description,
        })
        await newCategory.save();
        return res.json({message:'Category added successfully'});


    } catch (error) {
        console.error('addCategory error',error);
        return res.status(500).json({error:'internal server error'});
    }
}


const getListCategory = async (req,res)=>{
    try {
        let {userId} = req.body;
        
        await Category.findByIdAndUpdate(userId,{isListed:true})

  broadcast('reload', { reason: 'categoryListed' }); //

        res.json({success:true})
    } catch (error) {
        res.json({success:false,
            message:'category failed to list'
        })
        console.error('category update fails to set false error',error)
        
    }
}

const getUnlistCategory = async (req,res)=>{
    try {
        let {userId} = req.body
        await Category.findByIdAndUpdate(userId,{isListed:false})
         broadcast('reload', { reason: 'categoryUnlisted' }); //
        res.json({success:true});
    } catch (error) {
        res.json({success:false,
            message:'category failed to Unlist'
        })
         console.error('category update fails to set true error',error)
    }
}

const geteditCategory = async (req,res)=>{
    try {
        const id = req.query.id;
        const category = await Category.findOne({_id:id});

        const adminData = req.session.admin;
        const adminEmail = await User.findById(adminData,{email:1})

        res.render('editCategory',{
            category:category,
            admin:adminEmail,
            activePage:'',
            // category:"",
        })
    } catch (error) {
        console.error('editcategory error',error)
    }
}



const editCategory = async (req,res)=>{
    try {
        const {name,description,categoryId} = req.body;
        console.log(name,description,categoryId)
        const existingCategory = await Category.findOne({name:name})
        if(existingCategory){
            return res.json({success:false,message:'category already exists'})
        }
        const updateCategory = await Category.findByIdAndUpdate(categoryId,{
            name,
            description
        });
        res.json({success:true})
            
        
    } catch (error) {
        console.error('edit category error',error);
       res.json({success:false,message:'category failed to update'})
       
    }
}



const test = async (req,res)=>{
    try {
        // const id = req.session.admin;
        //        const adminName = await User.findById(id,{name:1,email:1})
        //       const email = adminName.email

         res.render('test',{
            admin:'abc',
            activePage:"dashboard",
        })

    } catch (error) {
        console.error(error)
    }
}

module.exports={
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    geteditCategory,
    editCategory,
    test,

}