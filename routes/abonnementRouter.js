const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/AbonnementController');

router.post('/abonnement', abonnementController.createAbonnement);
router.get('/abonnement', abonnementController.getAllAbonnements);
router.get('/abonnement/:id', abonnementController.getAbonnementById);
router.put('/abonnement/:id', abonnementController.updateAbonnement);
router.delete('/abonnement/:id', abonnementController.deleteAbonnement);
router.get('/abonnement/history/:userId', abonnementController.getAbonnementHistory);

module.exports = router;
