const db = require('../config/db');

// Créer un produit avec images
exports.createProduit = (req, res) => {
  try {
    const { nom, description, prix, quantite, categorie_id } = req.body;
    const images = req.files;

    // Insérer le produit
    const insertProduitQuery = `
      INSERT INTO produits (nom, description, prix, quantite, categorie_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertProduitQuery, [nom, description, prix, quantite, categorie_id], (err, result) => {
      if (err) {
        console.error('Erreur produit:', err);
        return res.status(500).json({ error: 'Erreur serveur (produit)' });
      }

      const produitId = result.insertId;

      // Si on a des images à insérer
      if (images && images.length > 0) {
        // Construire les valeurs avec URL complètes
        const imageValues = images.map(file => {
          // Construire URL complète (ex: http://localhost:3000/uploads/produits/nomfichier.jpg)
          const fullPath = file.filename;
          return [produitId, fullPath];
        });

        const insertImagesQuery = `INSERT INTO image_produit (produit_id, chemin) VALUES ?`;

        db.query(insertImagesQuery, [imageValues], (err2) => {
          if (err2) {
            console.error('Erreur image:', err2);
            return res.status(500).json({ error: 'Erreur serveur (image)' });
          }

          res.status(201).json({
            message: 'Produit et images enregistrés',
            produitId: produitId,
            images: imageValues.map(v => v[1]) // liste des URLs des images
          });
        });
      } else {
        // Pas d’images
        res.status(201).json({
          message: 'Produit enregistré sans image',
          produitId: produitId,
          images: []
        });
      }
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer tous les produits avec images
exports.getAllProduits = async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(chemin) FROM image_produit WHERE produit_id = p.id) AS images
      FROM produits p
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Erreur DB:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un seul produit avec images
exports.getProduitById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(chemin) FROM image_produit WHERE produit_id = p.id) AS images
      FROM produits p
      WHERE p.id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Erreur DB:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      res.json(results[0]);
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour un produit
exports.updateProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prix, quantite, categorie_id } = req.body;
    const images = req.files;

    // Mettre à jour les informations du produit
    const updateProduitQuery = `
      UPDATE produits 
      SET nom = ?, description = ?, prix = ?, quantite = ?, categorie_id = ?
      WHERE id = ?
    `;

    db.query(updateProduitQuery, [nom, description, prix, quantite, categorie_id, id], (err, result) => {
      if (err) {
        console.error('Erreur mise à jour produit:', err);
        return res.status(500).json({ error: 'Erreur serveur (produit)' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      // Si de nouvelles images sont fournies, les ajouter
      if (images && images.length > 0) {
        const imageQuery = `INSERT INTO image_produit (produit_id, chemin) VALUES ?`;
        const imageValues = images.map(file => [id, file.filename]);

        db.query(imageQuery, [imageValues], (err2) => {
          if (err2) {
            console.error('Erreur ajout images:', err2);
            return res.status(500).json({ error: 'Erreur serveur (image)' });
          }

          res.json({ message: 'Produit mis à jour avec nouvelles images' });
        });
      } else {
        res.json({ message: 'Produit mis à jour' });
      }
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un produit et ses images (grâce au ON DELETE CASCADE)
exports.deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM produits WHERE id = ?';

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Erreur suppression produit:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      res.json({ message: 'Produit supprimé avec succès' });
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// Mettre à jour le stock d'un produit (réduction lors de l'expédition)
exports.updateStock = (req, res) => {
  try {
    const { id } = req.params;
    const { quantite_reduite } = req.body;

    if (!quantite_reduite || quantite_reduite <= 0) {
      return res.status(400).json({ error: 'Quantité à réduire invalide' });
    }

    // Vérifier d'abord le stock disponible
    const checkStockQuery = 'SELECT quantite FROM produits WHERE id = ?';
    
    db.query(checkStockQuery, [id], (err, results) => {
      if (err) {
        console.error('Erreur vérification stock:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      const stockActuel = results[0].quantite;
      
      if (stockActuel < quantite_reduite) {
        return res.status(400).json({ 
          error: 'Stock insuffisant', 
          stockActuel: stockActuel,
          quantiteDemandee: quantite_reduite
        });
      }

      // Mettre à jour le stock
      const updateQuery = 'UPDATE produits SET quantite = quantite - ? WHERE id = ?';
      
      db.query(updateQuery, [quantite_reduite, id], (err2, result) => {
        if (err2) {
          console.error('Erreur mise à jour stock:', err2);
          return res.status(500).json({ error: 'Erreur serveur' });
        }

        res.json({ 
          message: 'Stock mis à jour avec succès',
          stockPrecedent: stockActuel,
          quantiteReduite: quantite_reduite,
          nouveauStock: stockActuel - quantite_reduite
        });
      });
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer tous les produits d'une catégorie avec images
exports.getAllProduitsByCategorieId = (req, res) => {
  try {
    const { categorie_id } = req.params;

    const query = `
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(chemin) 
         FROM image_produit 
         WHERE produit_id = p.id) AS images
      FROM produits p
      WHERE p.categorie_id = ?
    `;

    db.query(query, [categorie_id], (err, results) => {
      if (err) {
        console.error('Erreur DB:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Aucun produit trouvé pour cette catégorie.' });
      }

      res.json(results);
    });
  } catch (error) {
    console.error('Erreur controlleur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
