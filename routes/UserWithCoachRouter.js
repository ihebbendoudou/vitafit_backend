const express = require('express');
const router = express.Router();
const UsersWithCoach = require('../controllers/UsersWithCoach'); // Correction du nom du fichier


// Route pour obtenir tous les utilisateurs avec coach
router.get('/users-with-coaches', UsersWithCoach.getUsersWithCoaches);

// Route pour rechercher des utilisateurs avec coach
router.get('/search-users-coaches', UsersWithCoach.searchUsersWithCoaches); 

// Route pour obtenir les utilisateurs par ID de coach
router.get('/users-by-coach/:coachId', UsersWithCoach.getUsersByCoachId);

module.exports = router;