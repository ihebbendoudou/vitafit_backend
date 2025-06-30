const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Coût du hachage

// 🔹 Ajouter un coach
exports.createCoach = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, specialite } = req.body;
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);
    
    const sql = 'INSERT INTO coach (nom, prenom, email, mot_de_passe, telephone, specialite) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nom, prenom, email, hashedPassword, telephone, specialite], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: 'Coach ajouté avec succès', id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du hachage du mot de passe' });
  }
};

// 🔹 Mettre à jour un coach
exports.updateCoach = async (req, res) => {
  try {
    const id = req.params.id;
    const { nom, prenom, email, mot_de_passe, telephone, specialite } = req.body;
    
    // Récupérer le coach existant
    db.query('SELECT * FROM coach WHERE id = ?', [id], async (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) return res.status(404).json({ message: 'Coach non trouvé' });
      
      const coach = results[0];
      let hashedPassword = coach.mot_de_passe; // Conserver le mot de passe existant par défaut
      
      // Hacher le nouveau mot de passe s'il est fourni
      if (mot_de_passe && mot_de_passe.trim() !== '') {
        hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);
      }
      
      // Mettre à jour le coach
      const sql = 'UPDATE coach SET nom = ?, prenom = ?, email = ?, mot_de_passe = ?, telephone = ?, specialite = ? WHERE id = ?';
      db.query(sql, [nom, prenom, email, hashedPassword, telephone, specialite, id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Coach mis à jour avec succès' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
  }
};

// 🔹 Obtenir tous les coachs (inchangé)
exports.getAllCoachs = (req, res) => {
  db.query('SELECT * FROM coach', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// 🔹 Obtenir un coach par ID (inchangé)
exports.getCoachById = (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM coach WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ message: 'Coach non trouvé' });
    res.json(result[0]);
  });
};

// 🔹 Supprimer un coach (inchangé)
exports.deleteCoach = (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM coach WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Coach supprimé avec succès' });
  });
};

// 🔍 Rechercher un coach (inchangé)
exports.searchCoachs = (req, res) => {
  const { query } = req.query;
  console.log("Recherche avec query =", query);

  if (!query) {
    return res.status(400).json({ message: 'Paramètre de recherche requis' });
  }

  const searchQuery = `%${query}%`;
  const sql = `
    SELECT * FROM coach 
    WHERE nom LIKE ? 
    OR prenom LIKE ? 
    OR email LIKE ? 
    OR telephone LIKE ? 
    OR specialite LIKE ?
  `;

  db.query(sql, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Erreur SQL :', err);
      return res.status(500).json({ error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Aucun coach trouvé' });
    }

    res.json(results);
  });
};

// 🔑 Mettre à jour le mot de passe d'un coach
exports.updatePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { currentPassword, newPassword } = req.body;

    console.log(`🔑 Tentative de mise à jour du mot de passe pour le coach ID ${id}`);

    // Vérifier que les deux mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Le mot de passe actuel et le nouveau mot de passe sont requis.' });
    }

    // Récupérer le coach pour vérifier le mot de passe actuel
    db.query('SELECT * FROM coach WHERE id = ?', [id], async (err, results) => {
      if (err) {
        console.error('❌ Erreur lors de la récupération du coach :', err);
        return res.status(500).json({ message: 'Erreur serveur.', error: err });
      }

      if (results.length === 0) {
        console.warn('⚠️ Coach non trouvé pour mise à jour du mot de passe.');
        return res.status(404).json({ message: 'Coach non trouvé.' });
      }

      const coach = results[0];

      // Vérifier que le mot de passe actuel est correct
      const isMatch = await bcrypt.compare(currentPassword, coach.mot_de_passe);
      if (!isMatch) {
        console.warn('⚠️ Mot de passe actuel incorrect.');
        return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe dans la base de données
      const sql = 'UPDATE coach SET mot_de_passe = ? WHERE id = ?';
      db.query(sql, [hashedPassword, id], (err, result) => {
        if (err) {
          console.error('❌ Erreur lors de la mise à jour du mot de passe :', err);
          return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe.', error: err });
        }

        if (result.affectedRows === 0) {
          console.warn('⚠️ Aucune ligne affectée lors de la mise à jour du mot de passe.');
          return res.status(404).json({ message: 'Coach non trouvé.' });
        }

        console.log('✅ Mot de passe mis à jour avec succès pour le coach ID :', id);
        res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
      });
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du mot de passe :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe.', error });
  }
};