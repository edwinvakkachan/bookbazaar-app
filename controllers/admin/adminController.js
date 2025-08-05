const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard')
    }
    res.render('adminLogin',{message:null})
}


const login = async (req,res)=>{
    try {
        const {email,password}=req.body;
        const findAdmin = await User.findOne({isAdmin:true,email:email});
        if(!findAdmin){
           return res.render('adminLogin',{message:'admin not found'})
        }
        const isMatch = await bcrypt.compare(password,findAdmin.password);
        if(!isMatch){
            return res.render('adminLogin',{message:'Invalid credentials'})
        }
        req.session.admin = findAdmin._id;
        return res.redirect('/admin/dashboard')
    } catch (error) {
        console.error('admin login error',error);
        res.render('adminLogin',{message:'something went wrong'})
        
    }
}

const loadDashboard = async (req,res)=>{
    try {
        if(req.session.admin){
            res.render('dashboard');
        }else {
            
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error('dashboard load error',error)
        res.redirect('/pageNotFound')
    }
}

module.exports={
    loadLogin,
    login,
    loadDashboard,
}