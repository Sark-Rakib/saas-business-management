const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Subscription = require('../models/Subscription');
const { FREE_PLAN_LIMITS } = require('../utils/constants');
const { parseLocalDate } = require('../utils/helpers');

const getPurchases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, paymentStatus, startDate, endDate, supplierId } = req.query;

    const filter = { businessId: req.businessId };
    if (search) filter.supplierName = { $regex: search, $options: 'i' };
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (supplierId) filter.supplier = supplierId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = parseLocalDate(startDate);
      if (endDate) {
        const end = parseLocalDate(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const [purchases, total, summary] = await Promise.all([
      Purchase.find(filter)
        .populate('supplier', 'name company phone')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(filter),
      Purchase.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' }, due: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const summaryData = summary[0] || { total: 0, paid: 0, due: 0, count: 0 };
    summaryData.totalPurchase = summaryData.total;
    summaryData.totalPaid = summaryData.paid;
    summaryData.totalDue = summaryData.due;

    return res.json({
      success: true,
      data: purchases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('supplier', 'name company phone email address')
      .populate('items.product', 'name sku')
      .lean();
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    return res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, supplier, supplierName, paymentMethod, paymentStatus, amountPaid, date, note, discount } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }
    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    const purchaseDate = parseLocalDate(date);

    const subscription = await Subscription.findOne({ userId: req.user._id, plan: { $ne: 'free' } });
    if (!subscription || !subscription.isActive()) {
      const count = await Purchase.countDocuments({ businessId: req.businessId });
      if (count + items.length > (FREE_PLAN_LIMITS.transactions || 100)) {
        return res.status(403).json({ success: false, message: 'Free plan limit reached. Upgrade to add more purchases.', code: 'LIMIT_REACHED' });
      }
    }

    const supplierDoc = await Supplier.findOne({ _id: supplier, businessId: req.businessId }).session(session);
    if (!supplierDoc) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    let subtotal = 0;
    let totalCost = 0;
    const populatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId: req.businessId }).session(session);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found: ' + (item.productId || '') });
      }

      const lineTotal = item.quantity * item.purchasePrice;
      subtotal += lineTotal;
      totalCost += lineTotal;

      populatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice || product.sellingPrice,
        total: lineTotal,
      });

      product.stock += item.quantity;
      product.purchasePrice = item.purchasePrice > 0 ? item.purchasePrice : product.purchasePrice;
      await product.save({ session });
    }

    const totalDiscount = discount || 0;
    const totalAmount = Math.max(0, subtotal - totalDiscount);
    const paid = amountPaid || (paymentStatus === 'paid' ? totalAmount : 0);
    const due = Math.max(0, totalAmount - paid);

    const purchaseCount = await Purchase.countDocuments({ businessId: req.businessId }) + 1;
    const invoiceNumber = `PUR-${new Date().getFullYear()}-${String(purchaseCount).padStart(5, '0')}`;

    const purchase = await Purchase.create([{
      businessId: req.businessId,
      userId: req.user._id,
      supplier,
      supplierName: supplierName || supplierDoc.name,
      items: populatedItems,
      subtotal,
      totalDiscount,
      totalAmount,
      totalCost,
      paymentMethod,
      paymentStatus,
      amountPaid: paid,
      dueAmount: due,
      date: purchaseDate,
      note,
      invoiceNumber,
    }], { session });

    supplierDoc.totalPurchases = (supplierDoc.totalPurchases || 0) + totalAmount;
    supplierDoc.totalPaid = (supplierDoc.totalPaid || 0) + paid;
    supplierDoc.dueAmount = Math.max(0, supplierDoc.totalPurchases - supplierDoc.totalPaid);
    await supplierDoc.save({ session });

    await Transaction.create([{
      businessId: req.businessId,
      userId: req.user._id,
      type: 'purchase',
      amount: paid,
      paymentMethod,
      date: purchaseDate,
      description: `Purchase - ${invoiceNumber} from ${supplierDoc.name}`,
      reference: invoiceNumber,
      entityType: 'purchase',
      entityId: purchase[0]._id,
    }], { session });

    await AuditLog.create([{ userId: req.user._id, businessId: req.businessId, action: 'purchase_created', entity: 'purchase', entityId: purchase[0]._id }], { session });

    await session.commitTransaction();

    const populated = await Purchase.findById(purchase[0]._id).populate('supplier', 'name company phone').lean();
    return res.status(201).json({ success: true, message: 'Purchase recorded successfully', data: populated });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const allowed = ['paymentMethod', 'paymentStatus', 'amountPaid', 'note'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const purchase = await Purchase.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const previousPaid = purchase.amountPaid || 0;

    if (updateData.amountPaid !== undefined) {
      const paid = Math.max(0, Number(updateData.amountPaid) || 0);
      updateData.amountPaid = paid;
      updateData.dueAmount = Math.max(0, purchase.totalAmount - paid);
    }

    Object.assign(purchase, updateData);
    await purchase.save();

    await Transaction.findOneAndUpdate(
      { entityId: purchase._id, entityType: 'purchase', businessId: req.businessId },
      { $set: { amount: purchase.amountPaid, paymentMethod: purchase.paymentMethod, date: purchase.date } }
    );

    const paidDelta = purchase.amountPaid - previousPaid;
    if (purchase.supplier && paidDelta !== 0) {
      const sup = await Supplier.findOne({ _id: purchase.supplier, businessId: req.businessId });
      if (sup) {
        sup.totalPaid = Math.max(0, (sup.totalPaid || 0) + paidDelta);
        sup.dueAmount = Math.max(0, (sup.totalPurchases || 0) - sup.totalPaid);
        await sup.save();
      }
    }

    const refreshed = await Purchase.findById(purchase._id).lean();
    return res.json({ success: true, message: 'Purchase updated successfully', data: refreshed });
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    for (const item of purchase.items) {
      await Product.findOneAndUpdate(
        { _id: item.product, businessId: req.businessId },
        { $inc: { stock: -item.quantity } }
      );
    }

    if (purchase.supplier) {
      const supplier = await Supplier.findOne({ _id: purchase.supplier, businessId: req.businessId });
      if (supplier) {
        supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - purchase.totalAmount);
        supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - purchase.amountPaid);
        supplier.dueAmount = Math.max(0, supplier.totalPurchases - supplier.totalPaid);
        await supplier.save();
      }
    }

    await Transaction.deleteMany({ entityId: purchase._id, businessId: req.businessId });

    return res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase };