const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, enum: ['rent','salary','electricity','internet','transport','marketing','product_purchase','maintenance','software','other'], default: 'other' },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash','bkash','nagad','bank','card','other'], default: 'cash' },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  attachment: { type: String, default: '' },
}, { timestamps: true });

expenseSchema.index({ businessId: 1 });
expenseSchema.index({ userId: 1 });
expenseSchema.index({ businessId: 1, date: -1 });
expenseSchema.index({ businessId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
