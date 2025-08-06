const User = require('../../models/userSchema');



const customerInfo = async (req,res)=>{
   try {
        // Fetch all users, excluding sensitive information
        const users = await User.find({})
            .select('-password -__v -resetPasswordToken -resetPasswordExpire')
            .sort({ createdAt: -1 }); // Newest first
        
        res.render('customer', { 
            title: 'Customer Management',
            users,
            currentPage: 'customers'
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        req.flash('error', 'Failed to load customer data');
        res.redirect('/admin/dashboard');
    }
}



module.exports = {
  customerInfo,
}
