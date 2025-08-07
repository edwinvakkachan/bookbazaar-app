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
    const limit = 3;

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

    res.render('customers', {
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
    res.redirect('/admin/customers');
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).send('Something went wrong');
  }
};

const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
    res.redirect('/admin/customers');
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).send('Something went wrong');
  }
};


module.exports = {
  customerInfo,
  blockUser,
  unblockUser,
}
