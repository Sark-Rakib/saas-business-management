const Business = require('../models/Business');
const Notification = require('../models/Notification');

const getSettings = async (req, res, next) => {
  try {
    const business = await Business.findById(req.businessId).lean();
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    return res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = ['name', 'logo', 'type', 'address', 'phone', 'email', 'website', 'currency', 'description', 'startingCapital'];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    return res.json({ success: true, message: 'Settings updated successfully', data: business });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
