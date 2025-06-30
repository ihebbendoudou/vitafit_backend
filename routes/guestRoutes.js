const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

// CRUD Routes
router.post('/', guestController.createGuest);
router.get('/', guestController.getAllGuests);
router.get('/:id', guestController.getGuestById);
router.put('/:id', guestController.updateGuest);
router.delete('/:id', guestController.deleteGuest);

module.exports = router;
