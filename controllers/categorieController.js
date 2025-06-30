const db = require('../config/db');

// Créer une catégorie
exports.createCategorie = async (req, res) => {
  try {
    const { nom } = req.body;

    const query = 'INSERT INTO categorie (nom) VALUES (?)';

    db.query(query, [nom], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.status(201).json({ message: 'Catégorie ajoutée avec succès', id: result.insertId });
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const query = 'SELECT * FROM categorie';

    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour une catégorie
exports.updateCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const query = 'UPDATE categorie SET nom = ? WHERE id = ?';

    db.query(query, [nom, id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }

      res.json({ message: 'Catégorie mise à jour avec succès' });
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une catégorie
exports.deleteCategorie = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM categorie WHERE id = ?';

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }

      res.json({ message: 'Catégorie supprimée avec succès' });
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
