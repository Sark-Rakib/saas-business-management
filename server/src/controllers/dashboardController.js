const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = () => {
  const d = startOfDay();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const startOfYear = () => new Date(new Date().getFullYear(), 0, 1);
const startOfLastMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

const getOverview = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const today = startOfDay();
    const week = startOfWeek();
    const month = startOfMonth();
    const year = startOfYear();
    const lastMonthStart = startOfLastMonth();

    const makeFilter = (date) => ({ businessId, date: { $gte: date } });

    const [
      revenueAgg, expenseAgg, investmentAgg, todayAgg,
      weekAgg, monthAgg, yearAgg, receivableAgg, payableAgg,
      transactionsToday, productSummary, customerCount,
      todayExpAgg, weekExpAgg, monthExpAgg, yearExpAgg,
      txTodayAgg, txWeekAgg, txMonthAgg, txYearAgg,
      supplierSummary, purchaseSummary, lowStockProducts,
      recentSales, recentTransactions,
      lastMonthAgg, lastMonthExpAgg, txLastMonthAgg,
    ] = await Promise.all([
      Sale.aggregate([{ $match: { businessId } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' }, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { businessId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Investment.aggregate([{ $match: { businessId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Sale.aggregate([{ $match: { businessId, date: { $gte: today } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }]),
      Sale.aggregate([{ $match: { businessId, date: { $gte: week } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }]),
      Sale.aggregate([{ $match: { businessId, date: { $gte: month } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }]),
      Sale.aggregate([{ $match: { businessId, date: { $gte: year } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }]),
      Sale.aggregate([
        { $match: { businessId, dueAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$dueAmount' } } },
      ]),
      Purchase.aggregate([
        { $match: { businessId, dueAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$dueAmount' } } },
      ]),
      Transaction.countDocuments({ businessId, date: { $gte: today } }),
      Product.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, totalProducts: { $sum: 1 }, totalStock: { $sum: '$stock' }, lowStock: { $sum: { $cond: [{ $lte: ['$stock', '$lowStockWarning'] }, 1, 0] } }, outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } } } },
      ]),
      Customer.countDocuments({ businessId }),
      Expense.aggregate([{ $match: { businessId, date: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { businessId, date: { $gte: week } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { businessId, date: { $gte: month } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { businessId, date: { $gte: year } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.countDocuments({ businessId, date: { $gte: today } }),
      Transaction.countDocuments({ businessId, date: { $gte: week } }),
      Transaction.countDocuments({ businessId, date: { $gte: month } }),
      Transaction.countDocuments({ businessId, date: { $gte: year } }),
      Supplier.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, totalSuppliers: { $sum: 1 }, totalPurchases: { $sum: '$totalPurchases' }, totalDue: { $sum: '$dueAmount' } } },
      ]),
      Purchase.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, totalPurchase: { $sum: '$totalAmount' }, totalDue: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
      ]),
      Product.find({ businessId, $expr: { $lte: ['$stock', '$lowStockWarning'] } })
        .sort({ stock: 1 })
        .limit(6)
        .select('name stock lowStockWarning sellingPrice')
        .lean(),
      Sale.find({ businessId })
        .populate('customer', 'name')
        .sort({ date: -1 })
        .limit(6)
        .select('invoiceNumber customerName customer paymentMethod amountPaid dueAmount totalAmount date paymentStatus')
        .lean(),
      Transaction.find({ businessId })
        .sort({ date: -1 })
        .limit(6)
        .select('type amount paymentMethod date description')
        .lean(),
      Sale.aggregate([{ $match: { businessId, date: { $gte: lastMonthStart, $lt: month } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }]),
      Expense.aggregate([{ $match: { businessId, date: { $gte: lastMonthStart, $lt: month } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.countDocuments({ businessId, date: { $gte: lastMonthStart, $lt: month } }),
    ]);

    const todayData = todayAgg[0] || { revenue: 0, profit: 0 };

    const periodHelper = (saleAgg, expAgg, txCount) => {
      const s = saleAgg[0] || { revenue: 0, profit: 0 };
      const e = expAgg[0]?.total || 0;
      return {
        revenue: s.revenue,
        expenses: e,
        profit: s.profit - e,
        transactions: txCount,
      };
    };

    const revenue = revenueAgg[0]?.revenue || 0;
    const expenses = expenseAgg[0]?.total || 0;
    const investment = investmentAgg[0]?.total || 0;
    const netProfit = revenue - expenses;
    const outstandingReceivables = receivableAgg[0]?.total || 0;
    const outstandingPayables = payableAgg[0]?.total || 0;
    const availableBalance = revenue + investment - expenses;

    const todaysExpenses = todayExpAgg[0]?.total || 0;

    const supplierData = supplierSummary[0] || { totalSuppliers: 0, totalPurchases: 0, totalDue: 0 };
    const purchaseData = purchaseSummary[0] || { totalPurchase: 0, totalDue: 0, count: 0 };

    return res.json({
      success: true,
      data: {
        financialOverview: {
          totalRevenue: revenue,
          totalExpenses: expenses,
          totalInvestment: investment,
          netProfit: Math.max(0, netProfit),
          netLoss: netProfit < 0 ? Math.abs(netProfit) : 0,
          availableBalance,
          outstandingReceivables,
          outstandingPayables,
        },
        todaysOverview: {
          todaysSales: todayData.revenue,
          todaysExpenses: todaysExpenses,
          todaysProfit: todayData.profit - todaysExpenses,
          transactionCount: transactionsToday,
        },
        periods: {
          today: periodHelper(todayAgg, todayExpAgg, txTodayAgg),
          week: periodHelper(weekAgg, weekExpAgg, txWeekAgg),
          month: periodHelper(monthAgg, monthExpAgg, txMonthAgg),
          lastMonth: periodHelper(lastMonthAgg, lastMonthExpAgg, txLastMonthAgg),
          year: periodHelper(yearAgg, yearExpAgg, txYearAgg),
        },
        products: (() => {
          const p = productSummary[0];
          return p
            ? { ...p, total: p.totalProducts, outOfStockCount: p.outOfStock }
            : { total: 0, totalProducts: 0, totalStock: 0, lowStock: 0, outOfStock: 0, outOfStockCount: 0 };
        })(),
        totalCustomers: customerCount,
        totalTransactions: transactionsToday,
        suppliers: {
          totalSuppliers: supplierData.totalSuppliers,
          totalPurchases: supplierData.totalPurchases,
          totalDue: supplierData.totalDue,
        },
        purchases: {
          totalPurchase: purchaseData.totalPurchase,
          totalDue: purchaseData.totalDue,
          count: purchaseData.count,
        },
        lowStockProducts,
        recentSales,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCharts = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { startDate, endDate, period } = req.query;

    const sixMonths = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
    const twelveMonths = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
    const from = startDate ? new Date(startDate) : (period === 'year' ? twelveMonths : sixMonths);

    const to = endDate ? new Date(endDate) : new Date();

    const [revenue, expenses, investments, cashFlow] = await Promise.all([
      Sale.aggregate([
        { $match: { businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Expense.aggregate([
        { $match: { businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Investment.aggregate([
        { $match: { businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Sale.aggregate([
        { $match: { businessId, date: { $gte: from, $lte: to } } },
        { $group: { _id: null, income: { $sum: '$amountPaid' } } },
      ]),
    ]);

    const labels = [];
    let cursor = new Date(from);
    cursor.setDate(1);
    while (cursor <= to) {
      labels.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const expenseCategories = await Expense.aggregate([
      { $match: { businessId, date: { $gte: from, $lte: to } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    const series = {
      revenue: labels.map(l => revenue.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0),
      expenses: labels.map(l => expenses.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0),
      profit: labels.map(l => {
        const rev = revenue.find(m => m._id.year === l.year && m._id.month === l.month)?.profit || 0;
        const exp = expenses.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0;
        return rev - exp;
      }),
      investments: labels.map(l => investments.find(m => m._id.year === l.year && m._id.month === l.month)?.total || 0),
    };

    return res.json({
      success: true,
      data: {
        labels: labels.map(l => `${l.month}/${l.year}`),
        series,
        expenseCategories,
        cashFlow: {
          totalIncome: cashFlow[0]?.income || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getCharts };
