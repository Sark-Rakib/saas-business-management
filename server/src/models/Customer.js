const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, default: '' },
  totalPurchases: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
}, { timestamps: true });

customerSchema.index({ businessId: 1 });
customerSchema.index({ userId: 1 });
customerSchema.index({ businessId: 1, name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
