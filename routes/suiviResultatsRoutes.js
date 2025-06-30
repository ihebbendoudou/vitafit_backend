
// routes/suiviResultatsRoutes.js
const express = require('express');
const router = express.Router();
const suiviResultatsController = require('../controllers/suiviResultatsController');

// POST : Créer un nouveau suivi résultat
router.post('/suivi-resultats', suiviResultatsController.createSuiviResultat);

// GET : Récupérer les résultats d’un utilisateur par ID
router.get('/suivi-resultats/:userId', suiviResultatsController.getSuiviResultatsByUserId);

module.exports = router;
