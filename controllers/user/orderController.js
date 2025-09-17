const Order = require('../../models/OrderSchema');
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const { nextOrderId } = require('../../utils/orderId')
const mongoose = require('mongoose')
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');





async function incrementStock(productId, qty) {
  if (!productId || !qty) return;
  
  const updated = await Product.findByIdAndUpdate(productId, { $inc: { quantity: qty } }, { new: true });
  if (!updated) return;
  
  if (updated.quantity > 0 && updated.status === 'Out of Stock') {
    updated.status = 'Available';
    await updated.save();
  }
}


async function decrementStock(productId, qty) {
  if (!productId) return { ok: false, message: 'Invalid product' };
  const qtyNum = Number(qty || 0);
  if (qtyNum <= 0) return { ok: false, message: 'Invalid qty' };

 
  const updated = await Product.findOneAndUpdate(
    { _id: productId, quantity: { $gte: qtyNum } },
    { $inc: { quantity: -qtyNum } },
    { new: true }
  );

  if (!updated) {
    
    return { ok: false, message: 'Insufficient stock' };
  }

  
  if (updated.quantity <= 0 && updated.status !== 'Out of Stock') {
    updated.status = 'Out of Stock';
    await updated.save();
  }

  return { ok: true, product: updated };
}

const createShowConforamtion = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const { addressId, paymentMethod, coupon = '' } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).send('Cart is empty');
    }

    const address = (user.addresses || []).find(a => String(a._id) === String(addressId));
    if (!address) return res.status(400).send('Address not found');

    
    const items = cart.items.map(it => ({
      product: it.product,
      title: it.title,
      qty: Number(it.qty || 0),
      priceAtAdd: it.priceAtAdd,
      image: it.image
    }));

  
    const decremented = []; 
    for (const it of items) {
      const pid = it.product;
      const qty = Number(it.qty || 0);
      if (!pid || qty <= 0) {
       
        for (const d of decremented) await incrementStock(d.productId, d.qty);
        return res.status(400).send('Invalid cart item quantity');
      }

      const r = await decrementStock(pid, qty);
      if (!r.ok) {
        
        for (const d of decremented) {
          try { await incrementStock(d.productId, d.qty); } catch(e){ console.error('rollback error', e); }
        }
        return res.status(400).send(`Could not place order: ${r.message} for item ${it.title}`);
      }

     
      decremented.push({ productId: pid, qty });
    }

   
    const subtotal = items.reduce((s, t) => s + (Number(t.priceAtAdd || 0) * Number(t.qty || 0)), 0);
    const shipping = 0;
    const total = subtotal + shipping;

   
    const orderId = await nextOrderId();

    const order = await Order.create({
      orderId,
      user: user._id,
      addressSnapshot: address.toObject ? address.toObject() : address,
      items,
      subtotal,
      shipping,
      total,
      payment: { method: paymentMethod || 'COD', status: 'pending' },
      coupon,
      status: 'created'
    });

   
    cart.items = [];
    await cart.save();

    
    const created = order.createdAt || new Date();
    const dateStr = created.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = created.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const estDelivery = new Date(created);
    estDelivery.setDate(estDelivery.getDate() + 7);
    const estDeliveryStr = estDelivery.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return res.render('paymentConfirmation', {
      order,
      orderIdDisplay: order.orderId,
      dateStr,
      timeStr,
      paymentMethod: order.payment.method,
      amount: order.total,
      estDeliveryStr
    });

  } catch (error) {
    console.error('createShowConforamtion error:', error);
    
    return res.status(500).send('Server error while placing order');
  }
};


const listOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { q, status, timeframe } = req.query;

    const filter = { user: userId, isDeleted: false };

    if (status) filter.status = status;
    if (q) filter.$or = [{ orderId: { $regex: q, $options: 'i' } }, { 'items.title': { $regex: q, $options: 'i' } }];

    
    if (timeframe) {
      if (timeframe === '30') {
        filter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      } else if (/^\d{4}$/.test(timeframe)) {
        const year = parseInt(timeframe);
        filter.createdAt = { $gte: new Date(year, 0, 1), $lte: new Date(year+1, 0, 1) };
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    res.render('orders', {
      active: 'orders',
      orders,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


const viewOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id }).lean();
    if (!order) return res.status(404).send('Order not found');
    res.render('orderDetail', { order, active: 'orders' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};




const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    
    const { itemIndex, reason } = req.body || {};
    const userId = req.session && req.session.user && req.session.user._id;

    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const order = await Order.findOne({ orderId, user: userId });
    console.log('user order details is', order);
    if (!order) throw new Error('Order not found');

    
    const isWholeCancel = (typeof itemIndex === 'undefined' || itemIndex === null || itemIndex === '');

    if (isWholeCancel) {
     
      if (['cancelled', 'refunded'].includes(order.status)) {
        throw new Error('Order already cancelled');
      }
      for (const it of order.items) {
        if (it.product && it.status !== 'cancelled') {
          await incrementStock(it.product, it.qty);
          it.status = 'cancelled';
          it.cancelReason = reason || '';
          it.cancelledAt = new Date();
        }
      }
      order.isCancelled = true;
      order.status = 'cancelled';
      order.cancelReason = reason || '';
      order.cancelledAt = new Date();
    } else {
      
      const idx = parseInt(itemIndex);
      if (Number.isNaN(idx) || !order.items[idx]) throw new Error('Item not found');
      const it = order.items[idx];
      if (it.status === 'cancelled') throw new Error('Item already cancelled');
      if (it.product) await incrementStock(it.product, it.qty);
      it.status = 'cancelled';
      it.cancelReason = reason || '';
      it.cancelledAt = new Date();

      const allCancelled = order.items.every(i => i.status === 'cancelled');
      order.status = allCancelled ? 'cancelled' : 'partially_cancelled';
    }

    await order.save();
    return res.json({ success: true, message: 'Cancellation processed' });
  } catch (err) {
    console.error('cancelOrder error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};






const RETURN_WINDOW_DAYS = 7; //return days

const returnItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const { itemIndex, reason } = req.body || {};

    
    const userId = (req.user && req.user._id) || (req.session && req.session.user && req.session.user._id);
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Return reason required' });
    }

    const order = await Order.findOne({ orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const now = Date.now();
    const windowMs = RETURN_WINDOW_DAYS ? RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000 : null;

    const isEligibleForReturn = (it) => {
      if (!it) return false;
      if ((it.status || '').toLowerCase() !== 'delivered') return false;

      
      const deliveredAt = it.deliveredAt || order.deliveredAt || order.updatedAt || order.createdAt;
      if (!deliveredAt) {
       
        return windowMs ? false : true;
      }
      if (!windowMs) return true;
      return (now - new Date(deliveredAt).getTime()) <= windowMs;
    };

    let anyChanged = false;

    if (typeof itemIndex === 'undefined' || itemIndex === null || itemIndex === '') {
      
      const eligibleItems = order.items.filter(it => isEligibleForReturn(it));
      if (eligibleItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No delivered items eligible for return' });
      }
      for (const it of order.items) {
        if (isEligibleForReturn(it)) {
          it.status = 'returned';
          it.returnReason = reason;
          it.returnedAt = new Date();
          if (it.product) await incrementStock(it.product, it.qty);
          anyChanged = true;
        }
      }
      order.isReturned = true;
    } else {
      
      const idx = parseInt(itemIndex, 10);
      if (Number.isNaN(idx) || !order.items[idx]) return res.status(400).json({ success: false, message: 'Item not found' });
      const it = order.items[idx];
      if (!isEligibleForReturn(it)) {
        return res.status(400).json({ success: false, message: 'This item is not eligible for return (not delivered or return window expired)' });
      }
      it.status = 'returned';
      it.returnReason = reason;
      it.returnedAt = new Date();
      if (it.product) await incrementStock(it.product, it.qty);
      anyChanged = true;
    }

    if (!anyChanged) return res.status(400).json({ success: false, message: 'Nothing to return' });

   
    const allReturnedOrCancelled = order.items.every(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'returned' || s === 'cancelled';
    });

    if (allReturnedOrCancelled) {
      order.status = 'returned'; 
    } else if (order.items.some(i => (i.status || '').toLowerCase() === 'returned')) {
      order.status = 'partially_returned';
    }

    
    order.audit = order.audit || [];
    order.audit.push({ by: userId, action: 'return-item', note: reason });

    await order.save();

    return res.json({ success: true, message: 'Return processed' });
  } catch (err) {
    console.error('returnItem error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Failed to process return' });
  }
};


const downloadInvoice =  async (req, res)=> {
  try {
    const { orderId } = req.params;
    const userId = req.user && req.user._id;

    
    const order = await Order.findOne({ orderId, user: userId }).lean();
    if (!order) return res.status(404).send('Order not found');

    
    const chargedItems = (order.items || []).filter(it => {
      const s = (it.status || '').toLowerCase();
      return s !== 'cancelled' && s !== 'returned';
    });

    const subtotalCalc = chargedItems.reduce((acc, it) => {
      const price = Number(it.priceAtAdd || 0);
      const qty = Number(it.qty || 0);
      return acc + (price * qty);
    }, 0);

   
    const shipping = Number(order.shipping || 0);
    const discounts = Number(order.discounts || 0);
    const totalCalc = subtotalCalc + shipping - discounts;

    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);

    
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    
    doc.fontSize(22).fillColor('#000').text('INVOICE', { align: 'center' });
    doc.moveDown(0.8);

   
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString();
    doc.fontSize(10).fillColor('#333');
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${dateStr}`);
    if (order.addressSnapshot) {
      const a = order.addressSnapshot;
      doc.moveDown(0.2);
      doc.text(`Customer: ${a.name || ''}`);
      const addrParts = [a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', ');
      if (addrParts) doc.text(`Ship To: ${addrParts}`);
      if (a.phone) doc.text(`Phone: ${a.phone}`);
    }
    doc.moveDown(0.6);

    
    const left = doc.x;
    const col = {
      sn: left,
      product: left + 40,
      qty: left + 300,
      status: left + 355,
      price: doc.page.width - 110 
    };

    doc.fontSize(11).fillColor('#000').text('S/N', col.sn, doc.y);
    doc.text('Product', col.product, doc.y);
    doc.text('Qty', col.qty, doc.y);
    doc.text('Status', col.status, doc.y);
    doc.text('Price', col.price, doc.y, { width: 90, align: 'right' });

    doc.moveDown(0.3);
    doc.moveTo(left, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#000').stroke();
    doc.moveDown(0.4);

    
    function ensureSpace(height = 20) {
      if (doc.y + height > doc.page.height - doc.page.margins.bottom - 100) {
        doc.addPage();
        
        doc.fontSize(11).fillColor('#000').text('S/N', col.sn, doc.y);
        doc.text('Product', col.product, doc.y);
        doc.text('Qty', col.qty, doc.y);
        doc.text('Status', col.status, doc.y);
        doc.text('Price', col.price, doc.y, { width: 90, align: 'right' });
        doc.moveDown(0.3);
        doc.moveTo(left, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#000').stroke();
        doc.moveDown(0.4);
      }
    }

    
    const allItems = order.items || [];
    for (let i = 0; i < allItems.length; i++) {
      const it = allItems[i];
      ensureSpace(36);

      const status = (it.status || 'processing').toLowerCase();
      const isCancelled = status === 'cancelled' || status === 'returned';
      const color = isCancelled ? '#888888' : '#000000';

      
      doc.fontSize(10).fillColor(color).text(String(i + 1), col.sn, doc.y);

      
      const titleOptions = { width: col.qty - col.product - 8 };
      doc.fontSize(10).fillColor(color).text(it.title || 'Item', col.product, doc.y, titleOptions);

      
      doc.fontSize(10).fillColor(color).text(String(it.qty || 0), col.qty, doc.y);

     
      doc.fontSize(10).fillColor(color).text((it.status || 'processing').toUpperCase(), col.status, doc.y);

      
      const priceValue = Number(it.priceAtAdd || 0) * Number(it.qty || 1);
      doc.fontSize(10).fillColor(color).text(String(priceValue), col.price, doc.y, { width: 90, align: 'right' });

      
      doc.moveDown(1);
      if (it.cancelReason || it.returnReason) {
        const reason = it.cancelReason ? `Cancel reason: ${it.cancelReason}` : `Return reason: ${it.returnReason}`;
        
        ensureSpace(18);
        doc.fontSize(9).fillColor('#cc0000').text(reason, col.product, doc.y, { width: doc.page.width - col.product - 60 });
        doc.moveDown(0.6);
      }
    }

    
    doc.moveTo(left, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#000').stroke();
    doc.moveDown(0.6);

    
    const totalsX = doc.page.width - 200;
    doc.fontSize(10).fillColor('#000');
    doc.text(`Subtotal: ${subtotalCalc}`, totalsX, doc.y, { width: 160, align: 'right' });
    doc.moveDown(0.3);
    doc.text(`Shipping: ${shipping}`, totalsX, doc.y, { width: 160, align: 'right' });
    doc.moveDown(0.3);
    doc.text(`Discounts: ${discounts}`, totalsX, doc.y, { width: 160, align: 'right' });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(12).text(`Total: ${totalCalc}`, totalsX, doc.y, { width: 160, align: 'right' });
    doc.font('Helvetica').moveDown(1);

   
    if (allItems.some(it => {
      const s = (it.status || '').toLowerCase();
      return s === 'cancelled' || s === 'returned';
    })) {
      doc.fontSize(9).fillColor('#cc0000').text(
        'Note: Some items in this invoice are cancelled or returned. Totals above are calculated excluding cancelled/returned items.',
        { align: 'left' }
      );
      doc.moveDown(0.6);
    }

    
    doc.fontSize(9).fillColor('#666').text('Thank you for shopping with us!', { align: 'center' });
    doc.end();

  } catch (err) {
    console.error('Invoice generation error:', err);
    if (!res.headersSent) res.status(500).send('Could not generate invoice');
  }
}



module.exports = {
  createShowConforamtion,
   listOrders,
   viewOrder,
   cancelOrder,
   returnItem,
   downloadInvoice,
}