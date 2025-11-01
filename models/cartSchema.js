const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  title: { type: String },
  sku: { type: String },
  priceAtAdd: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  maxPerOrderAtAdd: { type: Number, default: null },
  image: { type: String },  
}, { _id: false });



const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});


CartSchema.methods.getSubtotal = function() {
  return this.items.reduce(
    (sum, it) => sum + (Number(it.priceAtAdd || 0) * Number(it.qty || 0)),
    0
  );
};

CartSchema.methods.findItemIndex = function(productId) {
  return this.items.findIndex(it => it.product.toString() === productId.toString());
};


CartSchema.methods.addOrIncrementSnapshot = function(productDoc, qty = 1) {
  const pid = productDoc._id.toString();
  const idx = this.findItemIndex(pid);
  const allowedQty = Number(qty) || 1;

  if (idx >= 0) {
    this.items[idx].qty = Number(this.items[idx].qty) + allowedQty;
  } else {
    this.items.push({
      product: productDoc._id,
      title: productDoc.title || '',
      sku: productDoc.sku || '',
      priceAtAdd: productDoc.price || 0,
      qty: allowedQty,
      maxPerOrderAtAdd: productDoc.maxPerOrder || null
    });
  }

 

  this.updatedAt = new Date();
  return this;
};

module.exports = mongoose.model('Cart', CartSchema);
