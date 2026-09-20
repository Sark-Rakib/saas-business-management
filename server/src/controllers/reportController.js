const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { buildDateFilter } = require('../utils/helpers');
const { requirePremium } = require('../middleware/auth');

const getPnlReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const [revenueAgg, expenseAgg, investmentAgg, salesCount] = await Promise.all([
      Sale.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, grossRevenue: { $sum: '$totalAmount' }, totalCost: { $sum: '$totalCost' }, grossProfit: { $sum: '$totalProfit' } } },
      ]),
      Expense.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, operatingExpenses: { $sum: '$amount' } } },
      ]),
      Investment.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, investment: { $sum: '$amount' } } },
      ]),
      Sale.countDocuments(dateFilter),
    ]);

    const revenue = revenueAgg[0] || { grossRevenue: 0, totalCost: 0, grossProfit: 0 };
    const expenses = expenseAgg[0] || { operatingExpenses: 0 };
    const investments = investmentAgg[0] || { investment: 0 };

    const netProfit = revenue.grossRevenue - revenue.totalCost - expenses.operatingExpenses;

    return res.json({
      success: true,
      data: {
        grossRevenue: revenue.grossRevenue,
        totalCost: revenue.totalCost,
        grossProfit: revenue.grossProfit,
        operatingExpenses: expenses.operatingExpenses,
        netProfit,
        netLoss: netProfit < 0 ? Math.abs(netProfit) : 0,
        totalInvestment: investments.investment,
        salesCount,
        period: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const [sales, byProduct, byPaymentMethod, summary] = await Promise.all([
      Sale.find(dateFilter).populate('items.product', 'name').sort({ date: -1 }).lean(),
      Sale.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
        { $sort: { revenue: -1 } },
      ]),
      Sale.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({ success: true, data: { sales, byProduct, byPaymentMethod, summary: summary[0] || { total: 0, profit: 0, cost: 0, count: 0 } } });
  } catch (error) {
    next(error);
  }
};

const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const [expenses, byCategory, summary] = await Promise.all([
      Expense.find(dateFilter).sort({ date: -1 }).lean(),
      Expense.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);

    return res.json({ success: true, data: { expenses, byCategory, summary: summary[0] || { total: 0, count: 0 } } });
  } catch (error) {
    next(error);
  }
};

const getInvestmentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const [investments, byType, summary] = await Promise.all([
      Investment.find(dateFilter).sort({ date: -1 }).lean(),
      Investment.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Investment.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);

    return res.json({ success: true, data: { investments, byType, summary: summary[0] || { total: 0, count: 0 } } });
  } catch (error) {
    next(error);
  }
};

const getCashFlowReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const business = req.businessId;
    const [sales, expenses, investments, withdrawals, summary] = await Promise.all([
      Sale.aggregate([{ $match: dateFilter }, { $group: { _id: null, amount: { $sum: '$amountPaid' } } }]),
      Expense.aggregate([{ $match: dateFilter }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      Investment.aggregate([{ $match: dateFilter }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'withdrawal' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'purchase' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
    ]);

    const income = sales[0]?.amount || 0;
    const expensesTotal = expenses[0]?.amount || 0;
    const investmentTotal = investments[0]?.amount || 0;
    const withdrawalTotal = withdrawals[0]?.amount || 0;
    const purchaseTotal = summary[0]?.amount || 0;

    const closingBalance = income + investmentTotal - expensesTotal - withdrawalTotal - purchaseTotal;

    return res.json({
      success: true,
      data: {
        openingBalance: 0,
        income,
        investment: investmentTotal,
        expenses: expensesTotal,
        purchases: purchaseTotal,
        withdrawals: withdrawalTotal,
        closingBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    dateFilter.businessId = req.businessId;

    const [products, salesByProduct] = await Promise.all([
      Product.find({ businessId: req.businessId }).sort({ name: 1 }).lean(),
      Sale.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.productName' }, quantitySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      ]),
    ]);

    return res.json({ success: true, data: { products, salesByProduct } });
  } catch (error) {
    next(error);
  }
};

const getCustomerReport = async (req, res, next) => {
  try {
    const customers = await Customer.find({ businessId: req.businessId })
      .sort({ totalPurchases: -1 })
      .limit(100)
      .lean();
    return res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPnlReport, getSalesReport, getExpenseReport, getInvestmentReport, getCashFlowReport, getProductReport, getCustomerReport };
