
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' }, 
  sku: { type: String, default: '' },
  title: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  priceAtAdd: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },


  status: { type: String, enum: ['ordered','cancelled','shipped','delivered','returned'], default: 'ordered' },
  cancelReason: { type: String, default: '' }, 
  returnReason: { type: String, default: '' },  
  cancelledAt: Date,
  deliveredAt: Date,   
  returnedAt: Date,

  image: { type: String, default: '' }
}, { _id: false });


const AddressSnapshotSchema = new Schema({
  label: String,
  name: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String
}, { _id: false });

const PaymentSchema = new Schema({
  method: String,
  status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  providerId: String,
  providerResponse: Schema.Types.Mixed
}, { _id: false });

const AuditEntrySchema = new Schema({
  by: { type: Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  action: String, 
  note: String
}, { _id: false });

const OrderSchema = new Schema({
  
  orderId: { type: String, required: true, unique: true },

  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true, default: [] },

  addressSnapshot: { type: AddressSnapshotSchema, required: true },

  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discounts: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },

  
  status: { 
    type: String, 
    enum: ['created','processing','paid','shipped','delivered','cancelled','partially_cancelled','refunded'], 
    default: 'created' 
  },
  isCancelled: { type: Boolean, default: false },
  cancelledAt: Date,
  cancelReason: { type: String, default: '' },
  isReturned: { type: Boolean, default: false },

  payment: { type: PaymentSchema, required: true, default: { method: 'COD', status: 'pending' } },

  
  invoiceNumber: String,
  invoiceUrl: String, 

  audit: { type: [AuditEntrySchema], default: [] },

  meta: Schema.Types.Mixed,
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
