const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(protect, requireBusiness);
router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

module.exports = router;
