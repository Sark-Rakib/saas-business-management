const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const investmentController = require('../controllers/investmentController');

router.use(protect, requireBusiness);
router.get('/', investmentController.getInvestments);
router.get('/:id', investmentController.getInvestment);
router.post('/', investmentController.createInvestment);
router.patch('/:id', investmentController.updateInvestment);
router.delete('/:id', investmentController.deleteInvestment);

module.exports = router;
