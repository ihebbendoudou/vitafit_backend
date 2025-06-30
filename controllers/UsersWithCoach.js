const db = require('../config/db');

// Lister tous les utilisateurs avec leur coach
exports.getUsersWithCoaches = (req, res) => {
  const sql = 'SELECT * FROM vue_users_avec_coach';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des données',
        details: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Aucun utilisateur avec coach trouvé' });
    }
    
    res.status(200).json(results);
  });
};

// Rechercher des utilisateurs avec coach par terme
exports.searchUsersWithCoaches = (req, res) => {
  const searchTerm = req.query.term;
  
  if (!searchTerm) {
    return res.status(400).json({ message: 'Le terme de recherche est requis' });
  }
  
  const sql = `
    SELECT * FROM vue_users_avec_coach
    WHERE user_nom LIKE ? 
      OR user_prenom LIKE ? 
      OR user_email LIKE ? 
      OR coach_nom LIKE ?
      OR coach_prenom LIKE ?
  `;
  
  const searchValue = `%${searchTerm}%`;
  
  db.query(sql, [
    searchValue, 
    searchValue, 
    searchValue,
    searchValue,
    searchValue
  ], (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ error: 'Erreur de recherche' });
    }
    
    res.status(200).json(results);
  });
};


// Obtenir les utilisateurs par ID de coach

exports.getUsersByCoachId = (req, res) => {
  const coachId = req.params.coachId;
  
  if (!coachId) {
    return res.status(400).json({ message: "L'ID du coach est requis" });
  }

  const sql = 'SELECT * FROM vue_users_avec_coach WHERE coach_id = ?';
  
  db.query(sql, [coachId], (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des utilisateurs',
        details: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        message: `Aucun utilisateur trouvé pour le coach ID ${coachId}`
      });
    }
    
    res.status(200).json(results);
  });
};