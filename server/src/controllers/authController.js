const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const { setTokenCookies, clearTokenCookies, createSession } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, businessName, email, phone, password } = req.body;

    if (!name || !businessName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, business name, email and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      businessId: null,
    });

    const business = await Business.create({
      userId: user._id,
      name: businessName,
      isOnboarded: false,
    });

    user.businessId = business._id;
    await user.save();

    await Subscription.create({
      userId: user._id,
      businessId: business._id,
      plan: 'free',
      status: 'active',
    });

    setTokenCookies(res, user);
    await createSession(user, req);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: user.toPublic(), business },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, phone, password, remember } = req.body;
    const identifier = email || phone;
    const rememberMe = remember === true || remember === 'true';

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    setTokenCookies(res, user);
    await createSession(user, req);

    const business = await Business.findById(user.businessId);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: { user: user.toPublic(), business },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save({ validateBeforeSave: false });
    }
    clearTokenCookies(res);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire')
      .lean();

    const business = await Business.findById(user.businessId).lean();
    const subscription = await Subscription.findOne({ userId: user._id }).lean();

    return res.json({ success: true, data: { user, business, subscription } });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token found' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = user.getAccessToken();
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ success: true, message: 'Token refreshed', data: { user: user.toPublic() } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    user.isModified('resetPasswordToken');
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        });
        await transporter.sendMail({
          to: user.email,
          subject: 'Password Reset - BusinessHub',
          html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        });
      } catch (emailErr) {
        console.log('Email not configured:', emailErr.message);
      }
    } else {
      console.log(`[DEV] Password reset link for ${user.email}: ${resetUrl}`);
    }

    return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+resetPasswordToken +resetPasswordExpire');

    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined;
    await user.save();

    clearTokenCookies(res);
    return res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
};

module.exports = { register, login, logout, me, refreshToken, forgotPassword, resetPassword };
