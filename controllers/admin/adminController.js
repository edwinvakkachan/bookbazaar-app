const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const loadLogin = async (req,res)=>{
    
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
            const adminData = req.session.admin;
            const email = await User.findById(adminData,{email:1})
            res.render('dashboard',{
                admin:email,
                activePage:'dashboard'

            });
        }else {
            
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error('dashboard load error',error)
        res.redirect('/pageNotFound')
    }
}

const logout = async (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.log('Error destroying admin session:', error);
            return res.redirect('/pageNotFound');
        }
        res.redirect('/admin/login');
    });
};


//testing controller

const testadmin = async (req,res)=>{
    try {
       const id = req.session.admin;
       const adminName = await User.findById(id,{name:1,email:1})
      const email = adminName.email

       console.log('admin',adminName)

        res.render('test',{
            admin:email,
            activePage:"dashboard"
        })
        
     
        console.log('success')
    } catch (error) {
        console.error('error',error)
    }
}


module.exports={
    loadLogin,
    login,
    loadDashboard,
    logout,
    testadmin,
}