const Transaction = require('../models/Transaction');
const { TRANSACTION_TYPES } = require('../utils/constants');
const { buildDateFilter } = require('../utils/helpers');

const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, type, paymentMethod, startDate, endDate, sortBy, sortOrder } = req.query;

    const filter = { businessId: req.businessId };
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
      ];
    }
    if (type && type !== 'all') filter.type = type;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
    Object.assign(filter, buildDateFilter(startDate, endDate));

    const sort = {};
    const sortField = sortBy || 'date';
    const direction = sortOrder === 'asc' ? 1 : -1;
    sort[sortField] = direction;
    sort._id = -1;

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        { $group: {
            _id: null,
            totalInflow: { $sum: { $cond: [{ $in: ['$type', ['sale', 'investment', 'income']] }, '$amount', 0] } },
            totalOutflow: { $sum: { $cond: [{ $in: ['$type', ['expense', 'withdrawal', 'purchase', 'refund', 'other']] }, '$amount', 0] } },
            count: { $sum: 1 },
          } },
      ]),
    ]);

    return res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { totalInflow: 0, totalOutflow: 0, count: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    return res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, paymentMethod, date, description, reference } = req.body;

    if (!type || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Type and amount are required' });
    }
    if (!TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    const transaction = await Transaction.create({
      businessId: req.businessId,
      userId: req.user._id,
      type,
      amount,
      paymentMethod,
      date,
      description,
      reference,
    });

    return res.status(201).json({ success: true, message: 'Transaction created successfully', data: transaction });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const allowed = ['type', 'amount', 'paymentMethod', 'date', 'description', 'reference'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    return res.json({ success: true, message: 'Transaction updated successfully', data: transaction });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    return res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
