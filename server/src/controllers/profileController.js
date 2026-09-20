const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire').lean();
    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true })
      .select('-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire');

    return res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    await AuditLog.create({ userId: user._id, businessId: user.businessId, action: 'password_changed', entity: 'user' });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
