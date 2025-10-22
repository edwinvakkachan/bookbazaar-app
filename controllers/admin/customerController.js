const User = require('../../models/userSchema');
const { search } = require('../../routes/adminRoute');



const getCustomerPage = async (req,res)=>{
  const adminData = req.session.admin;
  const email = await User.findById(adminData,{email:1})
  res.render('customers',{
    title: 'Customers',
    activePage:'customers',
    admin: email,
  })
}

const getCustomersApi = async (req,res)=>{
  try {
     const page = parseInt(req.query.page) || 1;
    const limit = 6;
     const total = await User.countDocuments({isAdmin:false});
    const totalPages = Math.ceil(total / limit);


    const users = await User.find({isAdmin:false}).sort({createdAt: -1,name:1,}).skip((page - 1) * limit)
      .limit(limit)
      .lean();



    res.json({success:true,
      users,
      totalPages,
      page,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error loading users' });
  }
}


const blockUser = async (req, res) => {
  try {
    const {userId} = req.body;
    console.log('userid',userId)
    await User.findByIdAndUpdate(userId, { isBlocked: true });
     res.json({ success: true});
  } catch (error) {
    console.error('Error blocking user:', error);
     res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const {userId} =req.body;
    await User.findByIdAndUpdate(userId, { isBlocked: false });
     res.json({ success: true});
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getCustomerPage,
  getCustomersApi,
}
