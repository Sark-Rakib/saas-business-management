const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protect, requireBusiness);
router.get('/', dashboardController.getOverview);
router.get('/charts', dashboardController.getCharts);

module.exports = router;
