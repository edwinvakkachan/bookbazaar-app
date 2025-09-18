const User = require("../../models/userSchema")
const Wishlist = require("../../models/whishlistSchema")


const nodemailer = require('nodemailer')
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const upload = require('../../helpers/multer'); 

const Product  = require('../../models/productSchema');
const Category = require('../../models/categorySchema')
const Brand = require('../../models/brandSchema');
const { addProducts } = require("../admin/productController");




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
   

    
    const categories = await Category.find({isListed:true})
    const allowedBrands = await Brand.find({ isBlocked: false }).select("_id"); 

    let productData = await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                            brand: { $in: allowedBrands.map(b => b._id) }, 
                            quantity:{$gt:0}
                            }).populate("brand", "brandName")    
                              .populate("category", "name");       
                            productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
                            productData = productData.slice(0,4);  
         
        

         //best selling products
         let bestSellingData = await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                            brand: { $in: allowedBrands.map(b => b._id) }, 
                            quantity:{$gt:0}
                            }).populate("brand", "brandName")    
                              .populate("category", "name");      

                            bestSellingData.sort((a,b)=>b.quantity - a.quantity)
                            bestSellingData = bestSellingData.slice(0,4)
                           
//best categories 
        let bestCategoryData =  await Product.find({isBlocked:false,
                            category:{$in:categories.map(category=>category._id)},
                             brand: { $in: allowedBrands.map(b => b._id) },
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
            popularCategory:unique}) 
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






const loadLogin = async (req, res) => {
  try {
    

    if (!req.session.user) {
      const blocked = req.query.blocked || false; 
      return res.render("login", { message: null, blocked });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("user login error", error);
    res.redirect("/pageNotFound");
  }
};




const login = async (req,res)=>{
  try {
    const {email,password}=req.body;
    const findUser = await User.findOne({isAdmin:false,email:email});
    if(!findUser){
      return res.render('login',{message:'user not found', blocked: false});
    }
    if(findUser.isBlocked){
      
      return res.redirect('/login?blocked=true');
    }

    const isMatch = await bcrypt.compare(password,findUser.password);
    if(!isMatch){
      return res.render('login',{message:'password do not match', blocked: false});
    }

    req.session.user = findUser;
    res.redirect('/');
  } catch (error) {
    console.error('error when user login',error);
    res.status(500).render('login',{message:'Something went wrong. Please try again later', blocked: false});
  }
};




const logout = (req, res) => {
  try {
      
    const sessionUserId = req.session?.user?._id || req.session?.user;
    
    if (req.session?.passport && String(req.session.passport.user) === String(sessionUserId)) {
      delete req.session.passport;
    }

    
    delete req.session.user;

    
    // console.log('session is',req.session)
    return res.redirect('/login');
  } catch (err) {
    console.error('user logout error', err);
    return res.redirect('/pageNotFound');
  }
};



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

    const limit = 9; 
    const skip = (page - 1) * limit;

    let query = { isBlocked: false };  

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

   
    const allowedCategories = await Category.find({ isListed: true }).select("_id");

    if (!category) {
      query.category = { $in: allowedCategories.map(c => c._id) };
    }
   
 
const allowedbrands = await Brand.find({ isBlocked: false }).select("_id");

    if (!brand) {
      query.brand = { $in: allowedbrands.map(c => c._id) };
    }

  
    const products = await Product.find(query)
  .populate("category", "name")   
  .populate("brand", "brandName")      
  .sort(sortQuery)
  .skip(skip)
  .limit(limit);

    
const totalProducts = await Product.countDocuments(query);
const totalPages = Math.ceil(totalProducts / limit);
console.log('products', products);


res.render("shop", {
  products,
  category: await Category.find({ isListed: true }),
  brand: await Brand.find({ isBlocked: false }), 
  currentPage: Number(page),
  totalPages,
  active: "books",
  query: req.query,
  sort: sort || ""    
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

 
    const book = {
      _id: product._id,  
  title: product.productName,
  author: product.author,  
  pages: product.pages,
  language: product.language,
  published: product.createdAt ? product.createdAt.toDateString() : "N/A",
  isbn: product.isbn,
  price: product.salePrice,
  oldPrice: product.regularPrice,
  stock: product.quantity > 0,
  
  // Ratings reviews
  rating: product.rating,
  avgRating: product.avgRating,
  reviews: product.reviews,
  ratingBreakdown: product.ratingBreakdown,
  reviewsList: product.reviewsList,

  // Descriptions
  description: product.description,
  longDescription: product.longDescription,
  benefits: product.benefits,

  // Images
  coverImg: product.productImage?.[0] || "/images/no-image.png",
  thumbnails: product.productImage?.slice(1) || []
};




    
    const related = relatedItems.map(item => ({
      id: item._id,
      title: item.productName,
      price: item.salePrice || 0,
      oldPrice: item.regularPrice || 0,
      rating: item.rating || 4,
      coverImg: item.productImage?.[0] || "/images/no-image.png"
    }));

console.log('book details',book)

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


const getUserProfile = async (req, res) => {
  try {
    

   const userId = req.session.user._id
    const user = await User.findById(userId).lean();
  

    
    const vmUser = {
      ...user,
      displayName: user.name || '', 
      dobFormatted: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : ''
    };

    
    if (vmUser.password) delete vmUser.password;

    
    return res.render('userProfile', {
      user: vmUser,
      active: 'profile',
      success: null,
      errors: null
    });
  } catch (err) {
    console.error('getUserProfile error:', err);
    return res.status(500).send('Server error');
  }
};






async function getEditProfile(req, res) {
  try {
  
    const userId = req.session.user._id;

    const userDoc = await User.findById(userId);
    

    const vm = userDoc.toObject();
    vm.displayName = vm.name || '';
    vm.dobFormatted = vm.dob ? new Date(vm.dob).toISOString().slice(0, 10) : '';

    res.render('userEditProfile', {
      user: vm,
      active: 'profile',
      errors: null,
      success: null
    });
  } catch (err) {
    console.error('getEditProfile error:', err);
    res.status(500).send('Server error');
  }
}


const postEditProfile = async (req, res) => {
  
  try {
    await new Promise((resolve, reject) => {
      upload.single('avatar')(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch (uploadErr) {
    console.error('Avatar upload error:', uploadErr);
    return res.render('userEditProfile', {
      user: {
        displayName: req.body.name || '',
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        dobFormatted: req.body.dob || ''
      },
      active: 'profile',
      errors: [{ msg: uploadErr.message || 'File upload failed' }],
      success: null,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  }

  try {
    

    const userId = req.session.user._id

    
    const { name, email, phone, dob, currentPassword, newPassword, confirmPassword } = req.body || {};
    const errors = [];

   
    if (!name || !String(name).trim()) errors.push({ msg: 'Name is required' });
    if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) errors.push({ msg: 'A valid email is required' });

    if (newPassword && newPassword.length > 0) {
      if (!currentPassword || currentPassword.length === 0) {
        errors.push({ msg: 'Current password is required to change your password' });
      }
      if (newPassword.length < 6) {
        errors.push({ msg: 'New password must be at least 6 characters' });
      }
      if (newPassword !== confirmPassword) {
        errors.push({ msg: 'New password and confirm password do not match' });
      }
    }

    if (errors.length) {
      return res.render('userEditProfile', {
        user: { displayName: name || '', name, email, phone, dobFormatted: dob || '' },
        active: 'profile',
        errors,
        success: null,
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
      });
    }

   
    const user = await User.findById(userId);
    

    
    const normalizedNewEmail = String(email).trim().toLowerCase();
    if (normalizedNewEmail !== String(user.email || '').toLowerCase()) {
      const conflict = await User.findOne({ email: normalizedNewEmail });
      if (conflict && conflict._id.toString() !== user._id.toString()) {
        return res.render('userEditProfile', {
          user: { displayName: name || '', name, email, phone, dobFormatted: dob || '' },
          active: 'profile',
          errors: [{ msg: 'Email already in use by another account' }],
          success: null,
          csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
        });
      }
      user.email = normalizedNewEmail;
      user.emailVerified = false;
    }

    
    user.name = String(name || '').trim();
    user.phone = phone && String(phone).trim().length ? String(phone).trim() : null;
    if (dob && String(dob).trim().length) {
      const d = new Date(dob);
      if (!isNaN(d)) user.dob = d;
    } else {
      user.dob = null;
    }

   

     
if (req.file) {
  console.log('DEBUG: received file:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    bufferExists: !!req.file.buffer
  });

  if (!req.file.buffer) {
    return res.render('userEditProfile', {
      user: { displayName: name || '', name, email, phone, dobFormatted: dob || '' },
      active: 'profile',
      errors: [{ msg: 'Uploaded file empty. Please try again.' }],
      success: null,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  }

  const avatarDir = path.join(__dirname, '..','..', 'public', 'uploads', 'avatars');
  try {
    await fs.promises.mkdir(avatarDir, { recursive: true });
  } catch (mkdirErr) {
    console.error('Could not create avatar dir', avatarDir, mkdirErr);
    return res.status(500).send('Server error');
  }

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  const fname = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const fullPath = path.join(avatarDir, fname);

  try {
    await fs.promises.writeFile(fullPath, req.file.buffer);
   
  } catch (writeErr) {
    console.error('Failed to write avatar to disk:', writeErr);
    return res.render('userEditProfile', {
      user: { displayName: name || '', name, email, phone, dobFormatted: dob || '' },
      active: 'profile',
      errors: [{ msg: 'Failed to save uploaded image. Try again later.' }],
      success: null,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  }

 
  try {
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldRelative = user.avatarUrl.replace(/^\//, '');
      const oldFull = path.join(__dirname, '..', 'public', oldRelative);
      if (fs.existsSync(oldFull)) await fs.promises.unlink(oldFull);
    }
  } catch (unlinkErr) {
    console.warn('Could not delete old avatar:', unlinkErr.message);
  }

  user.avatarUrl = `/uploads/avatars/${fname}`;
}







    
    if (newPassword && newPassword.length > 0) {
      const ok = await bcrypt.compare(String(currentPassword || ''), String(user.password || ''));
      if (!ok) {
        return res.render('userEditProfile', {
          user: { displayName: name || '', name, email, phone, dobFormatted: dob || '' },
          active: 'profile',
          errors: [{ msg: 'Current password is incorrect' }],
          success: null,
          csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
        });
      }
      user.password = await bcrypt.hash(String(newPassword), 10);
    }

   
    await user.save();
    const fresh = await User.findById(user._id).lean();
    if (fresh && fresh.password) delete fresh.password;
    if (req.session) req.session.user = fresh;

    return res.redirect('/userProfile');
  } catch (err) {
    console.error('postEditProfile error:', err);
    return res.render('userEditProfile', {
      user: {
        displayName: req.body.name || '',
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        dobFormatted: req.body.dob || ''
      },
      active: 'profile',
      errors: [{ msg: 'Server error. Please try again.' }],
      success: null,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  }
};







const getAddress = async (req, res) => {
  try {
    
    const userId = req.session.user._id
   

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).send('User not found');

    user.addresses = Array.isArray(user.addresses) ? user.addresses : [];
    return res.render('addresses', { user });
  } catch (error) {
    console.error('getAddresses error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAddAddress = async(req,res)=>{
  try {
    res.render('addressAdd', { user: req.session.user || null });
  } catch (error) {
    
  }
}


const addAddress = async (req, res) => {
  try {
    
    const userId = req.session.user._id
    

    if (!req.body) return res.status(400).json({ message: 'No form data received' });

    
    const addressData = { ...req.body };

    
    addressData.isPrimary = (addressData.isPrimary === 'true' || addressData.isPrimary === 'on' || addressData.isPrimary === true);

    
    if (!addressData.name || !addressData.line1) {
      return res.status(400).json({
        message: 'Validation error',
        errors: { name: addressData.name ? undefined : 'required', line1: addressData.line1 ? undefined : 'required' }
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.addresses)) user.addresses = [];

    
    if (user.addresses.length === 0) {
      addressData.isPrimary = true;
    } else if (addressData.isPrimary) {
      user.addresses.forEach(a => (a.isPrimary = false));
    }

    user.addresses.push(addressData);
    await user.save();

    
  return res.redirect('/addresses')
  } catch (error) {
    console.error('addAddress error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEditAddress = async (req,res)=>{
  try {
    const sessionUser = req.session.user;
    const addressId = req.params.addressId;
    

    
    const foundUser = await User.findById(sessionUser._id);
    if (!foundUser) return res.status(404).send('User not found');

    const addr = foundUser.addresses.id(addressId);
    if (!addr) return res.status(404).send('Address not found');

    return res.render('editAddress', { address: addr });
  } catch (error) {
    console.error('get editPage error', error);
    return res.redirect('/pageNotFound');
  }
}



const editAddress = async (req, res) => {
  try {
   
    const userId = req.session.user._id
    

    const { addressId } = req.params;
    if (!addressId) return res.status(400).json({ message: 'addressId param required' });
    if (!req.body) return res.status(400).json({ message: 'No form data received' });

    const updates = { ...req.body };
    updates.isPrimary = (updates.isPrimary === 'true' || updates.isPrimary === 'on' || updates.isPrimary === true);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.addresses)) user.addresses = [];

    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    if (updates.isPrimary) {
      user.addresses.forEach(a => (a.isPrimary = false));
    }

    addr.set(updates);
    await user.save();

    res.redirect('/addresses')
  } catch (error) {
    console.error('editAddress error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id || req.session.user;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.addresses)) user.addresses = [];

    
    user.addresses = user.addresses.filter(a => String(a._id) !== String(addressId));

    
    if (!user.addresses.some(a => a.isPrimary) && user.addresses.length) {
      user.addresses[0].isPrimary = true;
    }

    await user.save();
   res.redirect('/addresses')
  } catch (error) {
    console.error('deleteAddress error:', error);
    return res.redirect('/pageNotFound')
  }
};



const setPrimary = async (req, res) => {
  try {
    
    const userId = req.session.user._id
    

    const { addressId } = req.params;
    if (!addressId) return res.status(400).json({ message: 'addressId param required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.addresses)) user.addresses = [];

    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    user.addresses.forEach(a => (a.isPrimary = a._id.toString() === addressId));
    await user.save();

    res.redirect('/addresses')
  } catch (error) {
    console.error('setPrimary error:', error);
    return res.redirect('/pageNotFound')
  }
};




const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user._id; 

    
    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
       return res.redirect('/wishlist');
    }

    await Wishlist.create({ userId, productId });
    res.redirect("/wishlist");
  } catch (err) {
    console.error(err);
    res.render("wishlist", { error: "Something went wrong" });
  }
};


const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;

   
    const items = await Wishlist.find({ userId }).populate('productId');

    
    const wishlistProductIds = items
      .map(it => it.productId && it.productId._id)
      .filter(Boolean); 

   
    let recommendations;
    if (wishlistProductIds.length === 0) {
      recommendations = await Product.aggregate([{ $sample: { size: 4 } }]);
    } else {
      recommendations = await Product.aggregate([
        { $match: { _id: { $nin: wishlistProductIds } } }, 
        { $sample: { size: 4 } }
      ]);
    }

    
    res.render('wishlist', {
      items,
      recommendations,
      user: req.session.user,
      cartCount: req.session.cart ? req.session.cart.length : 0
    });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.render('wishlist', {
      items: [],
      recommendations: [],
      error: 'Unable to load wishlist',
      user: req.session.user,
      cartCount: req.session.cart ? req.session.cart.length : 0
    });
  }
};


const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.user._id;

    await Wishlist.deleteOne({ userId, productId });
    res.redirect("/wishlist");
  } catch (err) {
    console.error(err);
    res.render("wishlist", { error: "Could not remove item" });
  }
};








const filterProduct = async (req,res)=>{
    try {
        const user = req.session.user;
        const category = req.query.category
        
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
    getUserProfile,
    postEditProfile,
    getEditProfile,
    getAddress,
    addAddress,
    getAddAddress,
    getEditAddress,
    editAddress,
    deleteAddress,
    setPrimary,
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    filterProduct,
    test,

};


