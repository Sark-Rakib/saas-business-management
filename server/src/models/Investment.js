const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  amount: { type: Number, required: true, min: 0 },
  source: { type: String, default: '' },
  type: { type: String, enum: ['owner','partner','external','additional_capital'], default: 'owner' },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { timestamps: true });

investmentSchema.index({ businessId: 1 });
investmentSchema.index({ userId: 1 });
investmentSchema.index({ businessId: 1, date: -1 });

module.exports = mongoose.model('Investment', investmentSchema);
