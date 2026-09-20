const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');

const getSuppliers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = { businessId: req.businessId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [suppliers, total, summary] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Supplier.countDocuments(filter),
      Supplier.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: null, totalSuppliers: { $sum: 1 }, totalPurchases: { $sum: '$totalPurchases' }, totalPaid: { $sum: '$totalPaid' }, totalDue: { $sum: '$dueAmount' } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: suppliers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { totalSuppliers: 0, totalPurchases: 0, totalPaid: 0, totalDue: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ businessId: req.businessId, supplier: supplier._id })
      .sort({ date: -1 })
      .limit(50)
      .populate('items.product', 'name')
      .lean();

    return res.json({ success: true, data: { ...supplier, purchaseHistory: purchases } });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, company, email, phone, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Supplier.countDocuments({ businessId: req.businessId });
      if (count >= (FREE_PLAN_LIMITS.suppliers || 15)) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more suppliers.', code: 'LIMIT_REACHED' });
      }
    }

    const supplier = await Supplier.create({
      businessId: req.businessId,
      userId: req.user._id,
      name,
      company,
      email,
      phone,
      address,
      notes,
    });

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'supplier_created', entity: 'supplier', entityId: supplier._id });

    return res.status(201).json({ success: true, message: 'Supplier added successfully', data: supplier });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'email', 'phone', 'address', 'notes'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    return res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    return res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };