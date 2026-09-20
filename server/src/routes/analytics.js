const express = require('express');
const router = express.Router();
const { protect, requireBusiness, requirePremium } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(protect, requireBusiness);
router.get('/', requirePremium, analyticsController.getAnalytics);

module.exports = router;
