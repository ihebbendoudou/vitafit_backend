const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Envoyer un message
router.post('/messages', messageController.sendMessage);

// Récupérer les messages d'une conversation avec un utilisateur spécifique
router.get('/messages/:user_id', messageController.getMessages);

// Récupérer toutes les conversations de l'utilisateur connecté
router.get('/conversations', messageController.getConversations);

// Récupérer les utilisateurs disponibles pour démarrer une conversation
router.get('/users/available', messageController.getAvailableUsers);

// Marquer les messages comme lus
router.put('/messages/:sender_id/read', messageController.markAsRead);

module.exports = router;