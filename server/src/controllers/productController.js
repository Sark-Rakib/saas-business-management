const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { generateSKU } = require('../utils/helpers');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const Subscription = require('../models/Subscription');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, category, status, lowStock } = req.query;

    const filter = { businessId: req.businessId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (lowStock === 'true') filter.stock = { $lte: 0 };
    if (lowStock === 'low') filter.$expr = { $lte: ['$stock', '$lowStockWarning'] };

    const [products, total, summary] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$lowStockWarning'] }, 1, 0] } },
            outOfStockCount: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
            stockValue: { $sum: { $multiply: ['$stock', '$purchasePrice'] } },
          } },
      ]),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { totalProducts: 0, totalStock: 0, lowStockCount: 0, outOfStockCount: 0, stockValue: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, purchasePrice, sellingPrice, stock, lowStockWarning, image, status, sku } = req.body;

    if (!name || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name, purchase price and selling price are required' });
    }
    if (purchasePrice < 0 || sellingPrice < 0 || (stock || 0) < 0) {
      return res.status(400).json({ success: false, message: 'Prices and stock cannot be negative' });
    }

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Product.countDocuments({ businessId: req.businessId });
      if (count >= FREE_PLAN_LIMITS.products) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more products.', code: 'LIMIT_REACHED' });
      }
    }

    const count = await Product.countDocuments({ businessId: req.businessId });
    const newProduct = await Product.create({
      businessId: req.businessId,
      userId: req.user._id,
      name,
      sku: sku || generateSKU(name, count + 1),
      description,
      category,
      purchasePrice,
      sellingPrice,
      stock: stock || 0,
      lowStockWarning,
      image,
      status,
    });

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'product_created', entity: 'product', entityId: newProduct._id });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const allowed = ['name','description','category','purchasePrice','sellingPrice','stock','lowStockWarning','image','status','sku'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'product_updated', entity: 'product', entityId: product._id });

    return res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'product_deleted', entity: 'product', entityId: product._id });

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
