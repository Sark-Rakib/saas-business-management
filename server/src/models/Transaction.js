const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sale','expense','investment','withdrawal','purchase','income','refund','other'], required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash','bkash','nagad','bank','card','other'], default: 'cash' },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  reference: { type: String, default: '' },
  entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

transactionSchema.index({ businessId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ businessId: 1, date: -1 });
transactionSchema.index({ businessId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
