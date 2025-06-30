const express = require('express');
const router = express.Router();
const controller = require('../controllers/commandeController');

// Créer une commande (public - pour les clients)
router.post('/commande', controller.createCommande);

// Routes protégées (authentification requise pour les admins)
// Lister toutes les commandes
router.get('/commande', controller.getAllCommandes);

// Détails d'une commande
router.get('/commande/:id',  controller.getCommandeDetails);
router.get('/commande/reference/:id', controller.getCommandeDetailsbyReference);

// Mise à jour du statut
router.put('/commande/:id/statut',  controller.updateCommandeStatut);

module.exports = router;
