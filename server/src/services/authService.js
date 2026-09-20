const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');

const setTokenCookies = (res, user) => {
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
};

const createSession = async (user, req) => {
  const refreshToken = user.getRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    userId: user._id,
    businessId: user.businessId,
    action: 'login',
    entity: 'auth',
    ip: req.ip || '',
  });

  return refreshToken;
};

module.exports = { setTokenCookies, clearTokenCookies, createSession };
