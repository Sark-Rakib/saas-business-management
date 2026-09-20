const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const saleController = require('../controllers/saleController');

router.use(protect, requireBusiness);
router.get('/', saleController.getSales);
router.get('/:id', saleController.getSale);
router.post('/', saleController.createSale);
router.patch('/:id', saleController.updateSale);
router.delete('/:id', saleController.deleteSale);

module.exports = router;
