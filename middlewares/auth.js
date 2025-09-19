const User = require('../models/userSchema');

const mongoose = require("mongoose");


const userAuth = async (req, res, next) => {
  try {
    
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // console.log(req.session.user);

    const userId = req.session.user._id || req.session.user;
    

    if (!mongoose.Types.ObjectId.isValid(userId)) {
     
      req.session.destroy(() => res.redirect("/login"));
      return;
    }

    const user = await User.findById(userId);
   

    if (user && !user.isBlocked) {
      req.session.user = user; 
      return next();
    } else {
      

      
      delete req.session.user;

      req.session.destroy(err => {
        if (err) console.error("Error destroying session:", err);
        return res.redirect("/login?blocked=true");
      });
    }
  } catch (error) {
    console.error(" error in user auth middleware", error);
    return res.status(500).send("userAuth middleware error");
  }
};





const adminAuth = (req, res, next) => {
  const adminId = req.session.admin; 
  // console.log(adminId)

  if (!adminId) {
    return res.redirect('/admin/login');
  }

  User.findById(adminId)
    .then(admin => {
      if (admin && admin.isAdmin) {
        req.admin = admin;
        return next();
      } else {
        return res.redirect('/admin/login');
      }
    })
    .catch(error => {
      console.log('admin middleware error', error);
      return res.status(500).send('adminAuth middleware error');
    });
};

module.exports ={
    userAuth,
    adminAuth,
}