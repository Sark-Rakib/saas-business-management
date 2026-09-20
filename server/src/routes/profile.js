const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

router.use(protect);
router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);

module.exports = router;
