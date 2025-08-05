const User = require('../models/userSchema');


const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
              return  next();
            }else {
              return  res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log('error in user auth middleware',error);
          return  res.status(500).send('userauth middleware error')
        })

    }else{
      return  res.redirect('/login')
    }
}

const adminAuth = (req, res, next) => {
  const adminId = req.session.admin; 

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