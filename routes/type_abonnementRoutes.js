const express = require('express');
const router = express.Router();
const typeAbonnementController = require('../controllers/typeAbonnementController');

// Créer un type d'abonnement
router.post('/type_abonnement', typeAbonnementController.createTypeAbonnement);

// Récupérer tous les types d'abonnement
router.get('/type_abonnement', typeAbonnementController.getAllTypesAbonnement);

// Récupérer un type d'abonnement par ID
router.get('/type_abonnement/:id', typeAbonnementController.getTypeAbonnementById);

// Mettre à jour un type d'abonnement
router.put('/type_abonnement/:id', typeAbonnementController.updateTypeAbonnement);

// Supprimer un type d'abonnement
router.delete('/type_abonnement/:id', typeAbonnementController.deleteTypeAbonnement);

module.exports = router;
