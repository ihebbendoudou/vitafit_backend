const express = require('express');
const router = express.Router();
const programmeController = require('../controllers/programmeController');

// Routes CRUD simples sans authentification
router.post('/', programmeController.createProgramme);
router.post('/jours', programmeController.addJour);
router.post('/exercices', programmeController.addExercice);
router.post('/medias', programmeController.addMedia);
router.put('/exercices/:exerciceId', programmeController.updateExercice);
router.delete('/jours/:jourId', programmeController.deleteJour);
router.delete('/exercices/:exerciceId', programmeController.deleteExercice);
router.delete('/medias/:mediaId', programmeController.deleteMedia);
router.get('/user/:userId', programmeController.getProgrammesByUser);
router.get('/:programmeId', programmeController.getProgrammeDetails);
router.delete('/:programmeId', programmeController.deleteProgramme);
router.get('/coach/:coachId', programmeController.getProgrammesByCoachId);


module.exports = router;