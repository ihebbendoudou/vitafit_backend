const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middleware/auth');

// 👉 Demande d’une consultation par un internaute (guest)
router.post('/guest/request', consultationController.requestConsultationByGuest);

// 👉 Demande d'une consultation par un utilisateur adhérent (avec token)
router.post('/user/request', authMiddleware, consultationController.requestConsultationByUser);

// CRUD
router.post('/', consultationController.createConsultation);
router.get('/', consultationController.getAllConsultations);
router.get('/:id', consultationController.getConsultationById);
router.put('/:id', consultationController.updateConsultation);
router.delete('/:id', consultationController.deleteConsultation);

// Routes pour obtenir les consultations par statut
router.get('/status/:statut', consultationController.getConsultationsByStatus);

// Routes pour les actions d'approbation/refus par l'admin
router.put('/:id/approve-admin', consultationController.approveByAdmin);
router.put('/:id/reject-admin', consultationController.rejectByAdmin);

// Routes pour les actions d'approbation/refus par le médecin
router.put('/:id/approve-medecin', consultationController.approveByMedecin);
router.put('/:id/reject-medecin', consultationController.rejectByMedecin);

// Route pour obtenir les consultations par médecin ID
router.get('/medecin/:medecinId', consultationController.getConsultationsByMedecinId);

module.exports = router;
