const express = require('express');
const router = express.Router();
const controller = require('../controllers/healthInitialController');

router.post('/health', controller.createFullHealthData);
router.get('/health/:userId', controller.getFullHealthByUserId);
router.put('/health/:userId', controller.updateFullHealthByUserId);
router.delete('/health/:userId', controller.deleteFullHealthByUserId);

module.exports = router;