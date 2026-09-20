const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const { EXPENSE_CATEGORIES } = require('../utils/constants');
const { buildDateFilter, parseLocalDate } = require('../utils/helpers');

const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, category, startDate, endDate, paymentMethod } = req.query;

    const filter = { businessId: req.businessId };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (category && category !== 'all') filter.category = category;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
    Object.assign(filter, buildDateFilter(startDate, endDate));

    const [expenses, total, summary, categorySummary] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: {
            _id: null,
            total: { $sum: '$amount' },
            monthly: { $sum: { $cond: [{ $gte: ['$date', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] }, '$amount', 0] } },
          } },
      ]),
      Expense.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    return res.json({
      success: true,
      data: expenses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { total: 0, monthly: 0 },
      categorySummary,
    });
  } catch (error) {
    next(error);
  }
};

const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    return res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, category, amount, paymentMethod, date, description, attachment } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }
    if (amount < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Expense.countDocuments({ businessId: req.businessId });
      if (count >= FREE_PLAN_LIMITS.transactions) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more expenses.', code: 'LIMIT_REACHED' });
      }
    }

    const defaultCategory = EXPENSE_CATEGORIES.includes(category) ? category : 'other';
    const expenseDate = parseLocalDate(date);

    const expense = await Expense.create([{
      businessId: req.businessId,
      userId: req.user._id,
      title,
      category: defaultCategory,
      amount,
      paymentMethod,
      date: expenseDate,
      description,
      attachment,
    }], { session });

    await Transaction.create([{
      businessId: req.businessId,
      userId: req.user._id,
      type: 'expense',
      amount,
      paymentMethod,
      date: expenseDate,
      description: `Expense - ${title}`,
      reference: title,
      entityType: 'expense',
      entityId: expense[0]._id,
    }], { session });

    await AuditLog.create([{ userId: req.user._id, businessId: req.businessId, action: 'expense_created', entity: 'expense', entityId: expense[0]._id }], { session });

    await session.commitTransaction();

    return res.status(201).json({ success: true, message: 'Expense added successfully', data: expense[0] });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const allowed = ['title', 'category', 'amount', 'paymentMethod', 'date', 'description', 'attachment'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const txPatch = {};
    if (updateData.amount !== undefined) txPatch.amount = updateData.amount;
    if (updateData.paymentMethod !== undefined) txPatch.paymentMethod = updateData.paymentMethod;
    if (updateData.date !== undefined) txPatch.date = parseLocalDate(updateData.date);
    if (updateData.title !== undefined) {
      txPatch.description = `Expense - ${updateData.title}`;
      txPatch.reference = updateData.title;
    }
    if (Object.keys(txPatch).length) {
      await Transaction.findOneAndUpdate(
        { entityId: expense._id, entityType: 'expense', businessId: req.businessId },
        { $set: txPatch }
      );
    }

    return res.json({ success: true, message: 'Expense updated successfully', data: expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await Transaction.deleteMany({ entityId: expense._id, businessId: req.businessId });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense };
