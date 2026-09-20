const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  type: { type: String, enum: ['retail','wholesale','restaurant','services','manufacturing','ecommerce','consulting','clothing','other'], default: 'other' },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  currency: { type: String, default: 'BDT' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  startingCapital: { type: Number, default: 0 },
  isOnboarded: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

businessSchema.index({ userId: 1 });

module.exports = mongoose.model('Business', businessSchema);
