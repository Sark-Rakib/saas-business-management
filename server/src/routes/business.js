const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const { getBusiness, updateBusiness, completeOnboarding } = require('../controllers/businessController');

router.use(protect, requireBusiness);
router.get('/', getBusiness);
router.patch('/', updateBusiness);
router.post('/onboarding', completeOnboarding);

module.exports = router;
