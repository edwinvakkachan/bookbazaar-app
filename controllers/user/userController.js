const User = require("../../models/userSchema")
const nodemailer = require('nodemailer')
const env = require('dotenv').config();
const bcrypt = require('bcrypt');


const loadSignup = async (req,res)=>{
    try {
        return res.render('signup')
    } catch (error) {
        console.error('signup page rendering failed',error.message)
        res.status(500).send('signup page rendering error')
    }
}



function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}
async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
             service: 'gmail',
             port:587,
             secure:false,
             requireTLS:true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,  
    } 
        });

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"veryfi your account",
            text:`your OTP is ${otp}`,
            html:`<b> your OTP:${otp}</b>`,
        })
       return info.accepted.length>0

    } catch (error) {
        console.error('error sending email',error)
        return false;
    }
}
const signup = async(req,res)=>{
    try {
       const {name,phone,email,password,confirmPassword}=req.body;
       if(password!==confirmPassword){
        return res.render('signup',{message:'passwords do not match'})
       }
       const finduser = await User.findOne({email});
       if(finduser){
        return res.render('signup',{message:'user with same email address already exists'});
       }
       const otp = generateOtp();
       const emailSent = await sendVerificationEmail(email,otp);
        

      req.session.userOtp = otp;
      req.session.userData = {name,phone,email,password} 
      console.log("send otp",otp);
     if (emailSent) {
        return res.render('verify-otp', { email });
        } else {
        return res.render('signup', { message: 'Failed to send OTP email. Try again.' });
        }

    } catch (error) {
        console.error("signup error",error)
        res.redirect('/pageNotFound')
    }
}



const pageNotFound = async (req,res)=>{
    try {
        return res.render('page-404') 
    } catch (error) {
        console.error('page not found rendering error',error.message);
        res.redirect('/pageNotFound')
    }
}



const loadHomepage = async (req,res)=>{
try {
    const user = req.session.user;
    if(user){
        const userData  = await User.findOne({_id:user._id})
        res.render('home',{user:userData})
    }else{
        return res.render('home');
    }

} catch (error) {
    console.error('Home page rendering failed',error.message)
    res.status(500).send('Home page rendering error')
}
}


const securePassword = async (password) =>{
    try {
       
        return await bcrypt.hash(password,10);
    } catch (error) {
        console.error("Password hashing failed:", error);
        throw error;
    }
};
const verifyOtp = async(req,res)=>{
    try {
        const {otp} = req.body;
        console.log('submitted otp',otp);
        console.log("Session OTP:", req.session.userOtp);

        if(otp.toString() === req.session.userOtp.toString()){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash,
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            delete req.session.userOtp;
            delete req.session.userData;
            res.json({success:true,redirectUrl:'/'})
        }else {
            res.status(400).json({success:false,message:'invalid OTP, try again'});
        }

        
    } catch (error) {
        console.error('error veryfing otp',error)
        res.status(500).json({success:false,message:'error occured otp validation'})
    }
}


const resendOTP = async (req,res)=>{
    try {
        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,
               message:'Email is not found in session', 
            })
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log('Resend new otp:',otp);
            res.status(200).json({success:true,message:'OTP Resend successfully'});
        }else{
            res.status(500).json({success:false,message:'Failed to Resend OTP. Try again'})
        }
    } catch (error) {
        console.error('Error resending OTP',error);
         res.status(500).json({success:false,message:'Internal server error occured while resending otp'})
    }
}




const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.error('user login error',error)
        res.redirect('/pageNotFound')
        
    }
}


const login = async(req,res)=>{
    try {
        const {email,password}=req.body;
        const findUser = await User.findOne({isAdmin:false,email:email});
        if(!findUser){
            return res.render('login',{message:'user not found'})
        }
        if(findUser.isBlocked){
            return res.render('login',{message:'User is blocked by admin'})
        }

        const isMatch = await bcrypt.compare(password,findUser.password);
        if(!isMatch){
            return res.render('login',{message:'password do not match'})
        }
        //  req.session.user = {
        //     id: findUser._id,
        // };
// uncommend above
         req.session.user = findUser;

        res.redirect('/');

    } catch (error) {
        console.error('error when user login',error);
        res.status(500).render('login',{message:'Something went wrong. Please try again later'})
    }
};


const logout = async(req,res)=>{
    try {
        req.session.destroy((error)=>{
            if(error){
                console.log('session destruction error',error.message);
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login');
        })
    } catch (error) {
        console.error('logout error',error);
        res.redirect('/pageNotFound')
    }
}

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOTP,
    loadLogin,
    login,
    logout,
};