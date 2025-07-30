const User = require("../../models/userSchema")



const loadSignup = async (req,res)=>{
    try {
        return res.render('signup')
    } catch (error) {
        console.error('signup page rendering failed',error.message)
        res.status(500).send('signup page rendering error')
    }
}


const signup = async (req,res)=>{
    const {name,phone,email,password} =req.body;
    try {
     const newUser = new User({name,phone,email,password});
     await newUser.save();
      console.log("User successfully created:", newUser);
     return res.redirect('/signup')   

    } catch (error) {
        console.error('form submission failed',error.message);
       res.status(500).send('form submission failed')
        
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

return res.render('home')

    
} catch (error) {
    console.error('Home page rendering failed',error.message)
    res.status(500).send('Home page rendering error')
}
}

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
};