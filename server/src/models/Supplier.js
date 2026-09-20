const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  company: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  totalPurchases: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
}, { timestamps: true });

supplierSchema.index({ businessId: 1 });
supplierSchema.index({ userId: 1 });
supplierSchema.index({ businessId: 1, name: 'text', company: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);