const Category = require('../../models/categorySchema')

const categoryInfo = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
         
        const limit = 4;
        const skip = (page-1)*limit;
        const categoryData = await Category.find({})
        .sort({createdAt:1}) //change here for sorting 
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories/limit);
        res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories,
            
        });
    } catch (error) {
        console.log('categeoryInfo controller error',error);
         return res.status(500).json({error:'internal server error'});

        
    }
}

const addCategory =  async (req,res)=>{
    try {
        const {name,description} = req.body;
        console.log("Incoming data:", req.body);
    const existingCategory = await Category.findOne({name});
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
        console.log('addCategory error',error);
        return res.status(500).json({error:'internal server error'});
    }
}


const getListCategory = async (req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect('/admin/category')
    } catch (error) {
        console.error('category update fails to set false error',error)
        
    }
}

const getUnlistCategory = async (req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}});
        res.redirect('/admin/category')
    } catch (error) {
         console.error('category update fails to set true error',error)
    }
}

const geteditCategory = async (req,res)=>{
    try {
        const id = req.query.id;
        const category = await Category.findOne({_id:id});
        res.render('editCategory',{
            category:category,
        })
    } catch (error) {
        console.error('editcategory error',error)
    }
}

const editCategory = async (req,res)=>{
    try {
        const id = req.params.id;
        const {categoryName,description} = req.body;
        const existingCategory = await Category.findOne({name:categoryName})
        if(existingCategory){
            return res.status(400).json({
               error:'category already exists try again'})
        }
        const updateCategory = await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description,
        },{new:true})

        if(updateCategory){
            res.redirect('/admin/category')
        }else{
            res.status(404).json({error:'category not found'})

            
        }
    } catch (error) {
        console.error('edit category error',error);
       res.status(500).json({error:'edit category error'});
       
    }
}

module.exports={
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    geteditCategory,
    editCategory,

}