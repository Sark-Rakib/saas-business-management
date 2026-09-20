const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sellingPrice: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerName: { type: String, default: 'Walk-in Customer' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash','bkash','nagad','bank','card','other'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending','paid','partial','refunded'], default: 'paid' },
  amountPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  invoiceNumber: { type: String },
}, { timestamps: true });

saleSchema.index({ businessId: 1 });
saleSchema.index({ userId: 1 });
saleSchema.index({ businessId: 1, date: -1 });
saleSchema.index({ businessId: 1, customer: 1 });

module.exports = mongoose.model('Sale', saleSchema);
