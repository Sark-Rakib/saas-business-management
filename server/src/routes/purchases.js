const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const purchaseController = require('../controllers/purchaseController');

router.use(protect, requireBusiness);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchase);
router.post('/', purchaseController.createPurchase);
router.patch('/:id', purchaseController.updatePurchase);
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;