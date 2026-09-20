const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
  };
};

const adminOnly = authorize('admin');

const requireBusiness = async (req, res, next) => {
  const user = req.user;
  const businessId = req.query.businessId || req.headers['x-business-id'];

  if (!businessId && !user.businessId) {
    return res.status(404).json({ success: false, message: 'No business found. Complete onboarding first.' });
  }

  const id = businessId || user.businessId;
  if (String(id) !== String(user.businessId)) {
    return res.status(403).json({ success: false, message: 'Access to this business is forbidden' });
  }
  req.businessId = user.businessId;
  next();
};

const requirePremium = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    const isPaidAndActive =
      subscription &&
      subscription.plan !== 'free' &&
      subscription.status === 'active' &&
      (!subscription.expiryDate || new Date(subscription.expiryDate) > new Date());

    if (!isPaidAndActive) {
      return res.status(403).json({
        success: false,
        message: 'This is a premium feature. Please upgrade your plan.',
        code: 'PREMIUM_REQUIRED',
      });
    }
    req.subscription = subscription;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Subscription check failed' });
  }
};

const rateLimiter = require('express-rate-limit');

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { protect, authorize, adminOnly, requireBusiness, requirePremium, authLimiter, apiLimiter };
