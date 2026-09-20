const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const { buildDateFilter } = require('../utils/helpers');

const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = { businessId: req.businessId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, total, summary] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
      Customer.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: null, totalCustomers: { $sum: 1 }, totalPurchases: { $sum: '$totalPurchases' }, totalPaid: { $sum: '$totalPaid' }, totalDue: { $sum: '$dueAmount' } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { totalCustomers: 0, totalPurchases: 0, totalPaid: 0, totalDue: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const sales = await Sale.find({ businessId: req.businessId, customer: customer._id })
      .sort({ date: -1 })
      .limit(50)
      .populate('items.product', 'name')
      .lean();

    return res.json({ success: true, data: { ...customer, purchaseHistory: sales } });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Customer.countDocuments({ businessId: req.businessId });
      if (count >= FREE_PLAN_LIMITS.customers) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more customers.', code: 'LIMIT_REACHED' });
      }
    }

    const customer = await Customer.create({
      businessId: req.businessId,
      userId: req.user._id,
      name,
      email,
      phone,
      address,
    });

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'customer_created', entity: 'customer', entityId: customer._id });

    return res.status(201).json({ success: true, message: 'Customer added successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'address'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
