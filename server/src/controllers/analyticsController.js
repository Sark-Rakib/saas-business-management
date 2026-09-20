const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { buildDateFilter } = require('../utils/helpers');
const { requirePremium } = require('../middleware/auth');

const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const monthsAgo = period === 'year' ? 12 : 6;
    const from = dateFilter.date?.$gte || new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, 1);
    const to = dateFilter.date?.$lte || new Date();

    const commonMatch = { businessId: req.businessId, date: { $gte: from, $lte: to } };

    const [monthlyRevenue, monthlyExpenses, monthlyInvestment, bestSellers, expenseCategories, customerActivity, investmentTrends] = await Promise.all([
      Sale.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Expense.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Investment.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Sale.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', quantitySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' }, profit: { $sum: { $subtract: ['$items.total', { $multiply: ['$items.quantity', '$items.purchasePrice'] }] } } } },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 },
      ]),
      Expense.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Sale.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: '$customer', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]).then(rows => rows.map(r => ({ customerId: r._id, purchases: r.count, total: r.total }))),
      Investment.aggregate([
        { $match: { businessId: req.businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const labels = [];
    let cursor = new Date(from);
    while (cursor <= to) {
      labels.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const revenueSeries = labels.map(l => monthlyRevenue.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0);
    const profitSeries = labels.map(l => monthlyRevenue.find(m => m._id.year === l.year && m._id.month === l.month)?.profit || 0);
    const expenseSeries = labels.map(l => monthlyExpenses.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0);
    const investmentSeries = labels.map(l => monthlyInvestment.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0);

    return res.json({
      success: true,
      data: {
        labels: labels.map(l => `${l.year}-${String(l.month).padStart(2, '0')}`),
        revenueSeries,
        profitSeries,
        expenseSeries,
        investmentSeries,
        bestSellers,
        expenseCategories,
        customerActivity,
        investmentTrends: investmentSeries,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
