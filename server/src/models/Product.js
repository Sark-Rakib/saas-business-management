const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  sku: { type: String, trim: true },
  category: { type: String, default: 'general' },
  description: { type: String, default: '' },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockWarning: { type: Number, default: 5 },
  image: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

productSchema.index({ businessId: 1 });
productSchema.index({ userId: 1 });
productSchema.index({ businessId: 1, name: 'text', category: 'text' });
productSchema.index({ businessId: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
