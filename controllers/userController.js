const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Coût du hachage

// 🔹 Ajouter un utilisateur
exports.addUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, tel, adresse, role, image } = req.body;
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const sql = 'INSERT INTO user (nom, prenom, email, password, tel, adresse, role, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [nom, prenom, email, hashedPassword, tel, adresse, role, image], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: 'Utilisateur ajouté avec succès', id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du hachage du mot de passe' });
  }
};

// 🔹 Obtenir tous les utilisateurs
exports.getAllUsers = (req, res) => {
  db.query('SELECT * FROM user', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// 🔹 Obtenir un utilisateur par ID
exports.getUserById = (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM user WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(result[0]);
  });
};

// 🔹 Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { nom, prenom, email, password, tel, adresse, role, image } = req.body;
    
    // Récupérer l'utilisateur existant
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE id = ?', [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    let hashedPassword = user.password;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }
    
    await new Promise((resolve, reject) => {
      const sql = 'UPDATE user SET nom = ?, prenom = ?, email = ?, password = ?, tel = ?, adresse = ?, role = ?, image = ? WHERE id = ?';
      db.query(sql, [nom, prenom, email, hashedPassword, tel, adresse, role, image, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ message: 'Utilisateur mis à jour avec succès' });
    
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur lors de la mise à jour' 
    });
  }
};

// 🔹 Mettre à jour le mot de passe d'un utilisateur
exports.updatePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Le mot de passe actuel et le nouveau mot de passe sont requis' });
    }
    
    // Récupérer l'utilisateur existant
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE id = ?', [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier que le mot de passe actuel est correct
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    await new Promise((resolve, reject) => {
      const sql = 'UPDATE user SET password = ? WHERE id = ?';
      db.query(sql, [hashedPassword, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ message: 'Mot de passe mis à jour avec succès' });
    
  } catch (error) {
    console.error('Erreur updatePassword:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur lors de la mise à jour du mot de passe' 
    });
  }
};

// 🔹 Supprimer un utilisateur
exports.deleteUser = (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM user WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  });
};
 // 🔍 Rechercher un utilisateur par nom, prénom, email, tel ou adresse
exports.searchUsers = (req, res) => {
  const { query } = req.query;
  console.log("Recherche avec query =", query); // Vérifier si la query est bien reçue

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const searchQuery = `%${query}%`;
  const sql = `
    SELECT * FROM user 
    WHERE nom LIKE ? 
    OR prenom LIKE ? 
    OR email LIKE ? 
    OR tel LIKE ? 
    OR adresse LIKE ?
  `;

  db.query(sql, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("Résultats trouvés:", results.length);
    res.json(results);
  });
};


