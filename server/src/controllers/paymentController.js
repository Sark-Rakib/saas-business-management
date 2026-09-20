const PaymentRequest = require('../models/PaymentRequest');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { PLANS } = require('../utils/constants');

const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [payments, total] = await Promise.all([
      PaymentRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentRequest.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const submitPayment = async (req, res, next) => {
  try {
    const { plan, paymentMethod, transactionId, senderNumber, amount, paymentDate } = req.body;

    if (plan !== 'pro') {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }
    if (!paymentMethod || !['bkash', 'nagad'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Payment method must be bKash or Nagad' });
    }
    if (!transactionId || !senderNumber || amount === undefined || !paymentDate) {
      return res.status(400).json({ success: false, message: 'Transaction ID, sender number, amount and payment date are required' });
    }
    if (amount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const existing = await PaymentRequest.findOne({
      userId: req.user._id,
      transactionId,
      status: { $ne: 'rejected' },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This transaction ID has already been submitted' });
    }

    const planInfo = PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }
    if (amount !== planInfo.price) {
      return res.status(400).json({ success: false, message: `Amount must be exactly ${planInfo.price} for the ${planInfo.name} plan` });
    }

    const payment = await PaymentRequest.create({
      userId: req.user._id,
      businessId: req.businessId,
      plan,
      amount,
      paymentMethod,
      transactionId,
      senderNumber,
      paymentDate,
      status: 'pending',
    });

    await AuditLog.create({ userId: req.user._id, businessId: req.businessId, action: 'payment_submitted', entity: 'payment', entityId: payment._id });

    return res.status(201).json({
      success: true,
      message: 'Payment request submitted. We will verify and activate your subscription shortly.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments, submitPayment };
