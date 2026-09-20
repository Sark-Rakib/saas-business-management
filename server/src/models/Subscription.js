const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: null },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', default: null },
}, { timestamps: true });

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ businessId: 1 });

subscriptionSchema.methods.isExpired = function () {
  if (this.plan === 'free') return false;
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

subscriptionSchema.methods.isActive = function () {
  return this.plan === 'free' || (!this.isExpired() && this.status === 'active');
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
