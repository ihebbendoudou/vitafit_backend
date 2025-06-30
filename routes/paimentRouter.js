// routes.js
const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');

// Route pour enregistrer un paiement en espèces
router.post('/paiement', paiementController.payerAbonnement);

// Route pour récupérer tous les paiements
router.get('/paiements', paiementController.getPaiements);

// Route pour récupérer les abonnements payés
router.get('/abonnements-payes', paiementController.getAbonnementsPaies);

// Route pour récupérer les abonnements non payés
router.get('/abonnements-non-payes', paiementController.getAbonnementsNonPaies);

module.exports = router;
