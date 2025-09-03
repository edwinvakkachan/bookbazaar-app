const User = require("../../models/userSchema")
const nodemailer = require('nodemailer')
const env = require('dotenv').config();
const bcrypt = require('bcrypt');

const Product  = require('../../models/productSchema');
const Category = require('../../models/categorySchema')
const Brand = require('../../models/brandSchema')




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

const about = async (req,res)=>{
  try {
    res.render('about',{
      active:'about'
    })
  } catch (error) {
    console.error('about page load error',error)
    res.redirect('/pageNotFound')
  }
}



function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
}


async function sendContactEmail(name, email, phone, message) {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL, 
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending contact email:", error);
    return false;
  }
}


const contact = async (req, res) => {
  try {
    const success = req.session.success;
    const error = req.session.error;

    
    req.session.success = null;
    req.session.error = null;

    return res.render("contact", { active: "contact", success, error });
  } catch (error) {
    console.error("contact page load error", error);
    res.redirect("/pageNotFound");
  }
};

const sendContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const emailSent = await sendContactEmail(name, email, phone, message);

    if (emailSent) {
      req.session.success = "Message sent successfully!";
    } else {
      req.session.error = "Failed to send message. Please try again.";
    }

    return res.redirect("/contact"); 
  } catch (error) {
    console.error("contact form error", error);
    req.session.error = "Something went wrong!";
    res.redirect("/contact");
  }
};



const pageNotFound = async (req,res)=>{
    try {
        return res.render('pageNotFound') 
    } catch (error) {
        console.error('page not found rendering error',error.message);
        res.redirect('/pageNotFound')
    }
}



const loadHomepage = async (req,res)=>{
try {
    const user = req.session.user;

    //prodcut to front page
    const categories = await Category.find({isListed:true})
    let productData = await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                            quantity:{$gt:0}
                            })    
                            productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
                            productData = productData.slice(0,4);  
         
        

         //best selling products
         let bestSellingData = await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                            quantity:{$gt:0}
                            })

                            bestSellingData.sort((a,b)=>b.quantity - a.quantity)
                            bestSellingData = bestSellingData.slice(0,4)
                           
//best categories 
        let bestCategoryData =  await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                            quantity:{$gt:0}
                            }).populate({ path: 'category', select: 'name' })

                             bestCategoryData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
                            bestCategoryData = bestCategoryData.slice(0,4);  
                            // console.log(bestCategoryData)

const unique = [];
const seen = new Set();

for (const p of bestCategoryData) {
  const id = p.category?._id?.toString();
  if (!id || seen.has(id)) continue;
  seen.add(id);
  unique.push(p);                 
  if (unique.length === 4) break; 
}



    if(user){
        const userData  = await User.findOne({_id:user._id})
        res.render('home',{
            user:userData,
            products:productData,
            bestSelling:bestSellingData,
            active: "home", 
            popularCategory:unique}) //prodcut data passed
    }else{
        return res.render('home',{
            products:productData,
            bestSelling:bestSellingData, 
            popularCategory:unique,
            active: "home",
        });
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
            // req.session.user = saveUserData._id;
            req.session.user = saveUserData;
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
 
         req.session.user = findUser;

        res.redirect('/');

    } catch (error) {
        console.error('error when user login',error);
        res.status(500).render('login',{message:'Something went wrong. Please try again later'})
    }
};



const logout = async (req,res)=>{
  try {
    delete req.session.user;
    res.redirect('/')
  } catch (error) {
    console.error('user logout error',error);
    res.redirect('/pageNotFound')
  }
}


const loadForgotPassword = async (req,res)=>{
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.error('Error loading forgot passsword',error)
        res.redirect('/pageNotFound')
    }
}

const forgotPasswordSendOtp =async (req,res)=>{
     try {
    const { email } = req.body;

    
    if (!email || email.trim() === "") {
      return res.render("forgotPassword", { error: "Email is required"});
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render("forgotPassword", { error: "Please enter a valid email address"});
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("forgotPassword", { error: "No account found with this email"});
    }

    
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {
      req.session.forgotOtp = otp;
      req.session.resetEmail = email;
      console.log("Forgot password OTP:", otp);

      return res.render("resetPassword", {
        email,
        success: "OTP sent to your email!",
      });
    } else {
      return res.render("forgotPassword", {
        error: "Failed to send OTP. Please try again."
      });
    }
  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    res.render("forgotPassword", { error: "Something went wrong. Please try again." });
  }
}

const loadResetPassword = async (req,res)=>{
    try {
        res.render('resetPassword')
    } catch (error) {
        console.error('error loading resetPassword page',error)
        res.redirect('/pageNotFound')
    }
}


const resetPassword = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    
    if (!req.session.forgotOtp || !req.session.resetEmail) {
      return res.render('forgotPassword', { error: 'OTP expired. Try again.' });
    }

    
    if (otp.toString() !== req.session.forgotOtp.toString() || email !== req.session.resetEmail) {
      return res.render('resetPassword', { email, error: 'Invalid OTP' });
    }

    
    if (password.length < 6) {
      return res.render('resetPassword', { email, error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.render('resetPassword', { email, error: 'Passwords do not match' });
    }

  
    const hashedPassword = await securePassword(password);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    
    delete req.session.forgotOtp;
    delete req.session.resetEmail;

    return res.redirect('/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.redirect('/pageNotFound');
  }
};




const resendForgotOtp = async (req, res) => {
  try {
    const email = req.session.resetEmail;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Session expired. Please request again.'
      });
    }

    const otp = generateOtp();
    req.session.forgotOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log('Resent forgot password OTP:', otp);
      return res.json({ success: true, message: 'A new OTP has been sent to your email!' });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error resending forgot password OTP:', error);
    
    res.status(500).json({ success: false, message: 'Internal server error. Try again.' });
  }
};



const loadshoppingPage = async (req,res)=>{
try {
    let { category, brand, price, sort, page = 1 } = req.query;
    console.log('default sorting',sort)

    const limit = 9; // book  per page
    const skip = (page - 1) * limit;

    let query = {};

    
    if (category) {
      
      query.category = { $in: category.split(",") };
    }

   
    if (brand) {
      query.brand = { $in: brand.split(",") };
    }

    
    if (price) {
      if (price === "under100") query.salePrice = { $lt: 100 };
      if (price === "100-250") query.salePrice = { $gte: 100, $lte: 250 };
      if (price === "250-500") query.salePrice = { $gte: 250, $lte: 500 };
      if (price === "above500") query.salePrice = { $gt: 500 };
    }

    
  
let sortQuery = { createdAt: -1 }; 
if (sort === "popularity") {
  sortQuery = { sold: -1 };
} else if (sort === "newest") {
  sortQuery = { createdAt: -1 };
} else if (sort === "priceAsc") {
  sortQuery = { salePrice: 1 };
} else if (sort === "priceDesc") {
  sortQuery = { salePrice: -1 };
}


    
    const products = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

   
    res.render("shop", {
      products,
      category: await Category.find(),
      brand: await Brand.find(),
      currentPage: Number(page),
      totalPages,
      active: "books",
      query: req.query, //check this 
      sort, // pass current sort
    });
  } catch (error) {
    console.error("Shop error:", error);
    res.status(500).send("Server Error");
  }
}


const getBookDetails = async (req,res)=>{
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).send("Book not found");
    }

   
    const relatedItems = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
    .limit(4); 

    // Map DB product 
    const book = {
      title: product.productName,
      author: product.brand || "Unknown Author",
      pages: product.pages || 0,
      language: product.language || "English",
      published: product.createdAt ? product.createdAt.toDateString() : "N/A",
      isbn: product.isbn || "N/A",
      price: product.salePrice || 0,
      oldPrice: product.regularPrice || 0,
      stock: product.quantity > 0,
      rating: product.rating || 4.0,
      reviews: product.reviews || 0,
      description: product.description || "No description available.",
      longDescription: product.longDescription || "No detailed description available.",
      benefits: product.benefits && product.benefits.length > 0 
                  ? product.benefits 
                  : [
                      "Sustainable Change: Small, incremental adjustments to daily routines lead to lasting habits without overwhelming effort.",
                      "Compounding Growth: Tiny changes accumulate over time, resulting in significant improvements.",
                      "Improved Discipline: A system-focused approach enhances self-discipline."
                    ],
      coverImg: product.productImage && product.productImage.length > 0 
                  ? product.productImage[0] 
                  : "/images/no-image.png",
      thumbnails: product.productImage && product.productImage.length > 1 
                    ? product.productImage.slice(1) 
                    : [],

      // New review-related fields
      avgRating: product.avgRating || 4.8,
      ratingBreakdown: product.ratingBreakdown || { 5: 70, 4: 15, 3: 10, 2: 3, 1: 2 },
      reviewsList: product.reviewsList && product.reviewsList.length > 0
                    ? product.reviewsList
                    : [
                        { user: "Nicolas Cage", date: "3 Days ago", rating: 5, title: "Great Product", content: "great product. very good quality" },
                        { user: "Sr. Robert Downey", date: "3 Days ago", rating: 5, title: "The best product in Market", content: "great product. very good quality" }
                      ]
    };



    
    const related = relatedItems.map(item => ({
      id: item._id,
      title: item.productName,
      price: item.salePrice || 0,
      oldPrice: item.regularPrice || 0,
      rating: item.rating || 4,
      coverImg: item.productImage?.[0] || "/images/no-image.png"
    }));



    res.render("bookDetails", {
      book,
      related,
      user: req.session.user || null,
      active: "books"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}







const filterProduct = async (req,res)=>{
    try {
        const user = req.session.user;
        const category = req.query.category
        console.log('the category id : ',category)
        const brand = req.query.brand
        const findCategory = await Category.findOne({_id:category})
        const findBrand = await Brand.findOne({_id:brand})
        const brands = await Brand.find({}).lean();
        const query ={
            isBlocked:false,
            quantity:{$gt:0},

        }

        if(findCategory){
            query.category = findCategory._id;
        }
        if(findBrand){
            query.brand = findBrand.brandName;
        }


    } catch (error) {
        
    }
}

const test = async (req,res)=>{


    
    try {
        res.render('test',{
            admin:"",
            activePage:""
        })
        console.log('success')
    } catch (error) {
        console.error('test page error',error)
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
    loadshoppingPage,
    getBookDetails,
    loadForgotPassword,
    forgotPasswordSendOtp,
    loadResetPassword,
    resetPassword,
    resendForgotOtp,
    about,
    contact,
    sendContact,
    filterProduct,
    test,
};