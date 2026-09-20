const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String, trim: true, default: '' },
  items: [purchaseItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'bank', 'card', 'other'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
  amountPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  invoiceNumber: { type: String, default: '' },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

purchaseSchema.index({ businessId: 1 });
purchaseSchema.index({ userId: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ businessId: 1, date: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);