
const Counter = require('../models/Counter');

async function nextOrderId() {
  const result = await Counter.findByIdAndUpdate(
    'orderId',                       
    { $inc: { seq: 1 } },             
    { new: true, upsert: true }       
  );
  
  return `ORD-${String(result.seq).padStart(6, '0')}`;
}

module.exports = { nextOrderId };
