const Order = require('../../models/OrderSchema');
const User = require('../../models/userSchema')
const STATUS_ENUM = ['created','processing','paid','shipped','out_for_delivery','delivered','cancelled','refunded'];



const listOrders = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const status = req.query.status || '';
    const sort = req.query.sort === 'asc' ? 1 : -1; 
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(5, parseInt(req.query.limit || '10', 10));

    const filter = { isDeleted: { $ne: true } };

    if (status) filter.status = status;

    if (q) {
      
      filter.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { 'addressSnapshot.name': { $regex: q, $options: 'i' } },
        { 'addressSnapshot.line1': { $regex: q, $options: 'i' } },
        { items: { $elemMatch: { title: { $regex: q, $options: 'i' } } } }
      ];
     
    }

    
    let userIdsFromSearch = [];
    if (q) {
      const users = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).select('_id').limit(50);
      if (users && users.length) userIdsFromSearch = users.map(u => u._id);
      if (userIdsFromSearch.length) {
        
        filter.$or = filter.$or || [];
        filter.$or.push({ user: { $in: userIdsFromSearch }});
      }
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'name email') 
      .sort({ createdAt: sort })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();


       const adminData = req.session.admin;
              const adminEmail = await User.findById(adminData,{email:1})

    res.render('orderList', {
      title: 'Order list',
      orders,
      q,
      status,
      sort: sort === 1 ? 'asc' : 'desc',
      page,
      limit,
      total,
      totalPages: Math.ceil(total/limit),
      STATUS_ENUM,
      admin:adminEmail,
      activePage:'orders',
    });
  } catch (err) {
    next(err);
  }
};

const viewOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
    console.log('my orders',order)
    if (!order) return res.status(404).send('Order not found');

     const adminData = req.session.admin;
    const adminEmail = await User.findById(adminData,{email:1})

    res.render('orderListView', { 
        title: `Order ${order.orderId}`, 
        order,
        admin:adminEmail,
        activePage:'orders',
     });
  } catch (err) {
    next(err);
  }
};


const updateStatus = async (req, res, next) => {
  try {
    
    const { status, itemIndex } = req.body || {};

    if (!status || !STATUS_ENUM.includes(status)) {
      return res.status(400).json({ ok: false, error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });

    
    if (!Array.isArray(order.audit)) order.audit = [];

    const now = new Date();

    
    const setItemStatus = (it, newStatus) => {
      it.status = newStatus;
      if (newStatus === 'delivered') it.deliveredAt = now;
      if (newStatus === 'cancelled') it.cancelledAt = now;
      
    };

    if (typeof itemIndex !== 'undefined' && itemIndex !== null && itemIndex !== '') {
      
      const idx = parseInt(itemIndex, 10);
      if (Number.isNaN(idx) || !order.items[idx]) {
        return res.status(400).json({ ok: false, error: 'Item not found' });
      }

      const item = order.items[idx];
      setItemStatus(item, status);

      
      const itemStatuses = order.items.map(i => (i.status || '').toLowerCase());
      if (itemStatuses.every(s => s === 'delivered' || s === 'returned' || s === 'cancelled')) {
        order.status = 'delivered';
        order.deliveredAt = now;
      } else if (itemStatuses.some(s => s === 'delivered')) {
        order.status = 'partially_delivered';
      } else {
        
        order.status = status;
      }
    } else {
      
      order.items.forEach(it => setItemStatus(it, status));
      order.status = status;

      if (status === 'delivered') {
        order.deliveredAt = now;
      } else if (status === 'cancelled') {
        order.isCancelled = true;
        order.cancelledAt = now;
      } else {
        
        if (status !== 'cancelled') {
          order.isCancelled = false;
          order.cancelledAt = undefined;
        }
      }
    }

    
    order.audit.push({
      by: (req.admin && req.admin._id) ? req.admin._id : null,
      action: `status:${status}`,
      note: req.body && req.body.note ? String(req.body.note) : '',
      at: now
    });

    await order.save();

    return res.json({ ok: true, status: order.status });
  } catch (err) {
    next(err);
  }
};



module.exports = {
    listOrders,
    viewOrder,
    updateStatus,
}