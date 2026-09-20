const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const { INVESTMENT_TYPES } = require('../utils/constants');
const { buildDateFilter, parseLocalDate } = require('../utils/helpers');

const getInvestments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, type, startDate, endDate } = req.query;

    const filter = { businessId: req.businessId };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (type && type !== 'all') filter.type = type;
    Object.assign(filter, buildDateFilter(startDate, endDate));

    const [investments, total, summary] = await Promise.all([
      Investment.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Investment.countDocuments(filter),
      Investment.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: investments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summary[0] || { total: 0, count: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const getInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, businessId: req.businessId }).lean();
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }
    return res.json({ success: true, data: investment });
  } catch (error) {
    next(error);
  }
};

const createInvestment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, amount, source, type, date, note } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }
    if (amount < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    const investmentDate = parseLocalDate(date);

    const investment = await Investment.create([{
      businessId: req.businessId,
      userId: req.user._id,
      title,
      amount,
      source,
      type: INVESTMENT_TYPES.includes(type) ? type : 'owner',
      date: investmentDate,
      note,
    }], { session });

    await Transaction.create([{
      businessId: req.businessId,
      userId: req.user._id,
      type: 'investment',
      amount,
      paymentMethod: 'other',
      date: investmentDate,
      description: `Investment - ${title}`,
      reference: source || title,
      entityType: 'investment',
      entityId: investment[0]._id,
    }], { session });

    await AuditLog.create([{ userId: req.user._id, businessId: req.businessId, action: 'investment_created', entity: 'investment', entityId: investment[0]._id }], { session });

    await session.commitTransaction();

    return res.status(201).json({ success: true, message: 'Investment recorded successfully', data: investment[0] });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const updateInvestment = async (req, res, next) => {
  try {
    const allowed = ['title', 'amount', 'source', 'type', 'date', 'note'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    const txPatch = {};
    if (updateData.amount !== undefined) txPatch.amount = updateData.amount;
    if (updateData.date !== undefined) txPatch.date = parseLocalDate(updateData.date);
    if (updateData.title !== undefined) {
      txPatch.description = `Investment - ${updateData.title}`;
      txPatch.reference = updateData.source || updateData.title;
    }
    if (updateData.source !== undefined && !txPatch.reference) {
      txPatch.reference = updateData.source || investment.title;
    }
    if (Object.keys(txPatch).length) {
      await Transaction.findOneAndUpdate(
        { entityId: investment._id, entityType: 'investment', businessId: req.businessId },
        { $set: txPatch }
      );
    }

    return res.json({ success: true, message: 'Investment updated successfully', data: investment });
  } catch (error) {
    next(error);
  }
};

const deleteInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    await Transaction.deleteMany({ entityId: investment._id, businessId: req.businessId });

    return res.json({ success: true, message: 'Investment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInvestments, getInvestment, createInvestment, updateInvestment, deleteInvestment };
