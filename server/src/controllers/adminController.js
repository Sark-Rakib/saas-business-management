const User = require('../models/User');
const Business = require('../models/Business');
const PaymentRequest = require('../models/PaymentRequest');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalBusinesses, pendingPayments, paidSubscriptions, totalRevenue, freeUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      Business.countDocuments(),
      PaymentRequest.countDocuments({ status: 'pending' }),
      Subscription.countDocuments({ plan: { $ne: 'free' }, status: 'active' }),
      PaymentRequest.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Subscription.countDocuments({ plan: 'free' }),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers: totalUsers - activeUsers,
        totalBusinesses,
        pendingPayments,
        paidSubscriptions,
        freeUsers,
        expiredSubscriptions: 0,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { search, isActive } = req.query;

    const filter = { role: 'user' };
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const businesses = await Business.find({ userId: { $in: users.map(u => u._id) } }).lean();
    const subscriptions = await Subscription.find({ userId: { $in: users.map(u => u._id) } }).lean();

    const data = users.map(user => ({
      ...user,
      business: businesses.find(b => String(b.userId) === String(user._id)) || null,
      subscription: subscriptions.find(s => String(s.userId) === String(user._id)) || null,
    }));

    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({ userId: req.user._id, businessId: null, action: 'user_status_updated', entity: 'user', entityId: user._id, details: { isActive } });

    return res.json({ success: true, message: isActive ? 'User activated' : 'User suspended', data: user });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) filter.status = status;

    const [payments, total] = await Promise.all([
      PaymentRequest.find(filter)
        .populate('userId', 'name email phone')
        .populate('businessId', 'name currency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentRequest.countDocuments(filter),
    ]);

    return res.json({ success: true, data: payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const reviewPayment = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const payment = await PaymentRequest.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment request not found' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This payment has already been reviewed' });
    }

    payment.status = status;
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();
    payment.reviewNote = reviewNote || '';
    await payment.save();

    if (status === 'approved') {
      const periodMonths = 12;
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + periodMonths);

      await Subscription.findOneAndUpdate(
        { userId: payment.userId, businessId: payment.businessId },
        {
          plan: payment.plan,
          status: 'active',
          startDate,
          expiryDate,
          paymentId: payment._id,
        },
        { upsert: true, new: true }
      );

      await Notification.create({
        userId: payment.userId,
        businessId: payment.businessId,
        title: 'Subscription activated!',
        message: `Your ${payment.plan} subscription is now active until ${expiryDate.toLocaleDateString()}. Thank you for upgrading!`,
        type: 'success',
      });
    } else {
      await Notification.create({
        userId: payment.userId,
        businessId: payment.businessId,
        title: 'Payment rejected',
        message: reviewNote || 'Your payment request was rejected. Please contact support or try again.',
        type: 'error',
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      businessId: payment.businessId,
      action: `payment_${status}`,
      entity: 'payment',
      entityId: payment._id,
      details: { reviewNote },
    });

    return res.json({
      success: true,
      message: status === 'approved' ? 'Payment approved, subscription activated' : 'Payment rejected',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { plan, status } = req.query;

    const filter = {};
    if (plan && plan !== 'all') filter.plan = plan;
    if (status && status !== 'all') filter.status = status;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'name email')
        .populate('businessId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res.json({ success: true, data: subscriptions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getUsers, updateUserStatus, getPayments, reviewPayment, getSubscriptions };
