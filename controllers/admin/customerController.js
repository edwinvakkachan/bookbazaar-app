const User = require('../../models/userSchema');



const customerInfo = async (req, res) => {
  try {
    let search = '';
    if (req.query.search) {
      search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page);
    }

    let sortBy = req.query.sortBy || ''; 
    const limit = 5;

    let sortOption = {};
    if (sortBy === 'name') {
      sortOption = { name: 1 }; 
    } else if (sortBy === 'email') {
      sortOption = { email: 1 };
    }

    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } }
      ]
    })
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();

    const count = await User.countDocuments({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } }
      ]
    });

    const totalPages = Math.ceil(count / limit);


     const adminData = req.session.admin;
    const email = await User.findById(adminData,{email:1})

    res.render('customers', {
       title: 'Customers',
      activePage:'customers',
      admin: email,
      customers: userData,
      currentPage: page,
      totalPages,
      search,
      sortBy 
    });

  } catch (error) {
    console.error("Error in customerInfo:", error);
    res.status(500).render('admin/customers', {
      customers: [],
      currentPage: 1,
      totalPages: 1,
      search: '',
      sortBy: ''
    });
  }
};




const blockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
     res.json({ success: true, userId: req.params.id, action: 'blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
     res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
     res.json({ success: true, userId: req.params.id, action: 'unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};


module.exports = {
  customerInfo,
  blockUser,
  unblockUser,
}
