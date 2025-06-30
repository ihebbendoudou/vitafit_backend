const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes CRUD
router.post('/reminders', reminderController.createReminder);
router.get('/reminders', reminderController.getAllReminders);
router.get('/reminders/user/:userId', reminderController.getRemindersByUserId);
router.get('/reminders/:id', reminderController.getReminderById);
router.put('/reminders/:id', reminderController.updateReminder);
router.delete('/reminders/:id', reminderController.deleteReminder);

module.exports = router;
