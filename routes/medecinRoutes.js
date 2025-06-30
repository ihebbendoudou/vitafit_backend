const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');

router.get('/medecin/search', medecinController.searchMedecins); // 🔍 Recherche
router.get('/medecin/', medecinController.getAllMedecins);        // 📋 Liste
router.get('/medecin/:id', medecinController.getMedecinById);     // 📄 Détail
router.post('/medecin/', medecinController.createMedecin);        // ➕ Création
router.put('/medecin/:id', medecinController.updateMedecin);      // ✏️ Modification
router.put('/medecin/password/:id', medecinController.updatePassword); // 🔑 Modification du mot de passe
router.delete('/medecin/:id', medecinController.deleteMedecin);   // 🗑️ Suppression

module.exports = router;
