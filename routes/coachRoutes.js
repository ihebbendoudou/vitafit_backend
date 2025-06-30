const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');

router.get('/coach/search', coachController.searchCoachs);  // 🔍 Recherche
router.get('/coach/', coachController.getAllCoachs);         // 📋 Liste
router.get('/coach/:id', coachController.getCoachById);      // 📄 Détail
router.post('/coach/', coachController.createCoach);         // ➕ Création
router.put('/coach/:id', coachController.updateCoach);       // ✏️ Modification
router.put('/coach/password/:id', coachController.updatePassword); // 🔑 Modification du mot de passe
router.delete('/coach/:id', coachController.deleteCoach);    // 🗑️ Suppression

module.exports = router;