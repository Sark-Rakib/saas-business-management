const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const { parseLocalDate } = require('../utils/helpers');

const getSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, paymentMethod, paymentStatus, startDate, endDate, customerId } = req.query;

    const filter = { businessId: req.businessId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = parseLocalDate(startDate);
      if (endDate) {
        const end = parseLocalDate(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    if (search) filter.$or = [{ customerName: { $regex: search, $options: 'i' } }, { invoiceNumber: { $regex: search, $options: 'i' } }];
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (customerId) filter.customer = customerId;

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('customer', 'name phone')
        .populate('items.product', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    const revenue = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' }, cost: { $sum: '$totalCost' } } },
    ]);

    const summaryData = revenue[0] || { total: 0, profit: 0, cost: 0 };
    summaryData.totalRevenue = summaryData.total;
    summaryData.totalProfit = summaryData.profit;
    summaryData.totalCost = summaryData.cost;

    return res.json({
      success: true,
      data: sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku')
      .lean();
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    return res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, customer, customerName, paymentMethod, paymentStatus, amountPaid, date, note, discount } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const saleDate = parseLocalDate(date);

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Sale.countDocuments({ businessId: req.businessId });
      if (count + items.length > FREE_PLAN_LIMITS.transactions) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more sales.', code: 'LIMIT_REACHED' });
      }
    }

    let subtotal = 0;
    let totalCost = 0;
    const populatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId: req.businessId }).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Product not found: ' + (item.productId || '') });
      }
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const lineTotal = item.quantity * item.sellingPrice;
      const lineDiscount = item.sellingPrice > 0 ? (item.discount || 0) : 0;
      subtotal += lineTotal;
      totalCost += item.quantity * product.purchasePrice;

      populatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        purchasePrice: product.purchasePrice,
        discount: lineDiscount,
        total: lineTotal - lineDiscount,
      });

      product.stock -= item.quantity;
      await product.save({ session });
    }

    const totalDiscount = discount || 0;
    const totalAmount = Math.max(0, subtotal - totalDiscount);
    const totalProfit = totalAmount - totalCost;
    const paid = amountPaid || (paymentStatus === 'paid' ? totalAmount : 0);
    const due = Math.max(0, totalAmount - paid);

    let resolvedCustomer = null;
    if (customer) {
      const cust = await Customer.findOne({ _id: customer, businessId: req.businessId }).session(session);
      if (!cust) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      resolvedCustomer = cust._id;
    }

    const saleCount = await Sale.countDocuments({ businessId: req.businessId }) + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(saleCount).padStart(5, '0')}`;

    const sale = await Sale.create([{
      businessId: req.businessId,
      userId: req.user._id,
      customer: resolvedCustomer,
      customerName: customerName || 'Walk-in Customer',
      items: populatedItems,
      subtotal,
      totalDiscount,
      totalAmount,
      totalCost,
      totalProfit,
      paymentMethod,
      paymentStatus,
      amountPaid: paid,
      dueAmount: due,
      date: saleDate,
      note,
      invoiceNumber,
    }], { session });

    if (resolvedCustomer) {
      const cust = await Customer.findOne({ _id: resolvedCustomer, businessId: req.businessId }).session(session);
      if (cust) {
        cust.totalPurchases = (cust.totalPurchases || 0) + totalAmount;
        cust.totalPaid = (cust.totalPaid || 0) + paid;
        cust.dueAmount = Math.max(0, cust.totalPurchases - cust.totalPaid);
        await cust.save({ session });
      }
    }

    await Transaction.create([{
      businessId: req.businessId,
      userId: req.user._id,
      type: 'sale',
      amount: paid,
      paymentMethod,
      date: saleDate,
      description: `Sale - Invoice ${invoiceNumber}`,
      reference: invoiceNumber,
      entityType: 'sale',
      entityId: sale[0]._id,
    }], { session });

    await AuditLog.create([{ userId: req.user._id, businessId: req.businessId, action: 'sale_created', entity: 'sale', entityId: sale[0]._id }], { session });

    await session.commitTransaction();

    const populated = await Sale.findById(sale[0]._id).populate('customer', 'name phone').lean();

    return res.status(201).json({ success: true, message: 'Sale recorded successfully', data: populated });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const updateSale = async (req, res, next) => {
  try {
    const allowed = ['paymentMethod', 'paymentStatus', 'amountPaid', 'note', 'customerName'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const sale = await Sale.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const previousPaid = sale.amountPaid || 0;

    if (updateData.amountPaid !== undefined) {
      const paid = Math.max(0, Number(updateData.amountPaid) || 0);
      updateData.amountPaid = paid;
      updateData.dueAmount = Math.max(0, sale.totalAmount - paid);
    }

    Object.assign(sale, updateData);
    await sale.save();

    await Transaction.findOneAndUpdate(
      { entityId: sale._id, entityType: 'sale', businessId: req.businessId },
      { $set: { amount: sale.amountPaid, paymentMethod: sale.paymentMethod, date: sale.date } }
    );

    const paidDelta = sale.amountPaid - previousPaid;
    if (sale.customer && paidDelta !== 0) {
      const cust = await Customer.findOne({ _id: sale.customer, businessId: req.businessId });
      if (cust) {
        cust.totalPaid = Math.max(0, (cust.totalPaid || 0) + paidDelta);
        cust.dueAmount = Math.max(0, (cust.totalPurchases || 0) - cust.totalPaid);
        await cust.save();
      }
    }

    const refreshed = await Sale.findById(sale._id).lean();
    return res.json({ success: true, message: 'Sale updated successfully', data: refreshed });
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    for (const item of sale.items) {
      await Product.findOneAndUpdate(
        { _id: item.product, businessId: req.businessId },
        { $inc: { stock: item.quantity } }
      );
    }

    if (sale.customer) {
      const cust = await Customer.findOne({ _id: sale.customer, businessId: req.businessId });
      if (cust) {
        cust.totalPurchases = Math.max(0, (cust.totalPurchases || 0) - sale.totalAmount);
        cust.totalPaid = Math.max(0, (cust.totalPaid || 0) - sale.amountPaid);
        cust.dueAmount = Math.max(0, cust.totalPurchases - cust.totalPaid);
        await cust.save();
      }
    }

    await Transaction.deleteMany({ entityId: sale._id, businessId: req.businessId });

    return res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSales, getSale, createSale, updateSale, deleteSale };
