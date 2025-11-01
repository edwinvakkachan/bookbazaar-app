const mongoose = require('mongoose');
const Product = require('../../models/productSchema'); 
const Order = require('../../models/OrderSchema');    
const User = require('../../models/userSchema'); 

function generateOrderId() {
  const now = Date.now();
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${now}-${rnd}`;
}

const  showDirectCheckout = async (req,res)=>{
   try {
     const {productId} = req.params;
     const{qty}= req.query;
     console.log(productId)
     console.log('the qty is',qty)

    // const { quantity, productId} = req.body;

    const product = await Product.findById(productId);
   const userId = req.session.user._id;
   const user = await User.findById(userId)
    res.render('directCheckout', {
      user,
      product,
      qty,
      totalPrice: product.salePrice,
    });


   } catch (error) {
    console.error('showDirectCheckout:', error);
    res.status(500).send('Server error');
   }
}

const placeDirectOrder = async (req, res) => {
  try {
    const userId = req.session.user._id; 
    const { productId, qty = 1, addressId, paymentMethod = 'cod' } = req.body;

    
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.quantity < qty) throw new Error('Insufficient stock');

    
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const address = user.addresses?.find(a => String(a._id) === String(addressId));
    if (!address) throw new Error('Invalid address');

    
    const order = new Order({
      orderId: generateOrderId(),
      user: userId,
      items: [
        {
          product: product._id,
          title: product.productName,
          qty,
          priceAtAdd: product.salePrice || product.regularPrice,
          image: product.productImage?.[0] || '',
        },
      ],
      addressSnapshot: address,
      subtotal: (product.salePrice || product.regularPrice) * qty,
      total: (product.salePrice || product.regularPrice) * qty,
      status: paymentMethod === 'cod' ? 'created' : 'pending',
      payment: { method: paymentMethod, status: 'pending' },
    });

    await order.save();

   
    product.quantity -= qty;
    if (product.quantity < 0) product.quantity = 0;
    await product.save();

    
    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order._id,
    });

  } catch (err) {
    console.error('placeDirectOrder:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

const showPaymentConfirmation = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId }]
    }).populate('items.product');

    if (!order) {
      return res.status(404).send('Order not found');
    }

   
    const createdAt = new Date(order.createdAt);
    const dateStr = createdAt.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = createdAt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    
    const estDelivery = new Date(order.createdAt);
    estDelivery.setDate(estDelivery.getDate() + 5);
    const estDeliveryStr = estDelivery.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.render('paymentConfirmation', {
      order,
      dateStr,
      timeStr,
      estDeliveryStr,
      paymentMethod: order.payment?.method?.toUpperCase() || 'COD',
    });
  } catch (err) {
    console.error('showPaymentConfirmation:', err);
    res.status(500).send('Server error');
  }
};


module.exports = {
    showDirectCheckout,
    placeDirectOrder,
    showPaymentConfirmation,
}
