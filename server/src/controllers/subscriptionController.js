const Subscription = require('../models/Subscription');
const PaymentRequest = require('../models/PaymentRequest');
const Business = require('../models/Business');
const { PLANS } = require('../utils/constants');

const getSubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user._id }).lean();
    if (!subscription) {
      subscription = await Subscription.create({ userId: req.user._id, businessId: req.businessId, plan: 'free', status: 'active' });
      subscription = subscription.toObject();
    }

    let isExpired = false;
    if (subscription.plan !== 'free' && subscription.expiryDate && new Date() > new Date(subscription.expiryDate)) {
      isExpired = true;
      subscription.status = 'expired';
      await Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' });
    }

    const plan = PLANS[subscription.plan] || PLANS.free;

    const latestPayment = await PaymentRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      data: { ...subscription, planDetails: plan, isExpired, latestPayment },
    });
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const plans = Object.entries(PLANS).map(([key, value]) => ({ id: key, ...value }));
    return res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const getPaymentInstructions = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        bkash: process.env.BKASH_PAYMENT_NUMBER || '01XXXXXXXXX',
        nagad: process.env.NAGAD_PAYMENT_NUMBER || '01XXXXXXXXX',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubscription, getPlans, getPaymentInstructions };
