const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  plan: { type: String, enum: ['pro'], required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bkash', 'nagad'], required: true },
  transactionId: { type: String, required: true },
  senderNumber: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

paymentRequestSchema.index({ userId: 1 });
paymentRequestSchema.index({ status: 1 });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
