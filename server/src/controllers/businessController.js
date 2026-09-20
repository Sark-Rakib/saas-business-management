const Business = require('../models/Business');

const getBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    return res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

const updateBusiness = async (req, res, next) => {
  try {
    const allowed = ['name','type','description','logo','currency','address','phone','email','website','startingCapital','isOnboarded'];
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
    return res.json({ success: true, message: 'Business updated successfully', data: business });
  } catch (error) {
    next(error);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const { name, type, currency, address, phone, startingCapital, description, logo } = req.body;

    const updateData = { isOnboarded: true };
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (currency) updateData.currency = currency;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    if (startingCapital !== undefined) updateData.startingCapital = startingCapital;
    if (description) updateData.description = description;
    if (logo) updateData.logo = logo;

    const business = await Business.findOneAndUpdate(
      { _id: req.businessId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    return res.json({ success: true, message: 'Onboarding completed', data: business });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBusiness, updateBusiness, completeOnboarding };
