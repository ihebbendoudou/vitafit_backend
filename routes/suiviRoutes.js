const express = require('express');
const router = express.Router();
const suiviController = require('../controllers/suiviController');

router.post('/suivis', suiviController.createSuivi);
router.get('/suivis', suiviController.getAllSuivis);
// GET all patients with medical follow-up (for coaches and admins) - MUST be before parameterized route
router.get('/suivis/all/patients', suiviController.getAllPatientsWithSuivi);

// GET patients by coach ID
router.get('/suivis/coach/:coachId/patients', suiviController.getPatientsByCoachId);

router.get('/suivis/:id', suiviController.getSuiviById);
router.put('/suivis/:id', suiviController.updateSuivi);
router.delete('/suivis/:id', suiviController.deleteSuivi);
// GET patients by doctor ID
router.get('/suivis/:medecinId/patients', suiviController.getUsersByMedecinId);

module.exports = router;
