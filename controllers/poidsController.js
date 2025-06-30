const db = require('../config/db');
const crypto = require('crypto');

// Ajouter un poids
exports.addWeight = (req, res) => {
  const { user_id, poids } = req.body;
  const photos = req.files ? req.files.map(file => {
    return `${req.protocol}://${req.get('host')}/uploads/poids/${file.filename}`;
  }) : [];
  
  const photosJson = JSON.stringify(photos);
  
  db.query(
    'INSERT INTO poids (user_id, poids, photos) VALUES (?, ?, ?)',
    [user_id, poids, photosJson],
    (error, result) => {
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json({
        message: 'Poids enregistré avec succès',
        id: result.insertId,
        photos: photos
      });
    }
  );
};

// Récupérer les poids d'un utilisateur
exports.getWeightsByUser = (req, res) => {
  const { userId } = req.params;
  db.query(
    'SELECT * FROM poids WHERE user_id = ? ORDER BY date_enregistrement DESC',
    [userId],
    (error, weights) => {
      if (error) return res.status(500).json({ error: error.message });
      
      // Parser les photos JSON pour chaque entrée
      const weightsWithPhotos = weights.map(weight => {
        let photos = [];
        if (weight.photos) {
          try {
            photos = JSON.parse(weight.photos);
          } catch (e) {
            photos = [];
          }
        }
        return {
          ...weight,
          photos: photos
        };
      });
      
      res.status(200).json(weightsWithPhotos);
    }
  );
};

// Mettre à jour un poids
exports.updateWeight = (req, res) => {
  const { poids } = req.body;
  const { id } = req.params;
  db.query(
    'UPDATE poids SET poids = ? WHERE id = ?',
    [poids, id],
    (error) => {
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ message: 'Poids mis à jour avec succès' });
    }
  );
};

// Supprimer un poids
exports.deleteWeight = (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM poids WHERE id = ?',
    [id],
    (error) => {
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ message: 'Poids supprimé avec succès' });
    }
  );
};

// Générer un token de partage pour l'historique de poids
exports.generateShareToken = (req, res) => {
  const { userId } = req.params;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
  
  // Vérifier si un token existe déjà pour cet utilisateur
  db.query(
    'SELECT * FROM weight_share_tokens WHERE user_id = ?',
    [userId],
    (error, existingTokens) => {
      if (error) return res.status(500).json({ error: error.message });
      
      if (existingTokens.length > 0) {
        // Mettre à jour le token existant
        db.query(
          'UPDATE weight_share_tokens SET token = ?, expires_at = ?, created_at = NOW() WHERE user_id = ?',
          [token, expiresAt, userId],
          (updateError) => {
            if (updateError) return res.status(500).json({ error: updateError.message });
            res.status(200).json({
              message: 'Token de partage généré avec succès',
              shareUrl: `${req.protocol}://${req.get('host')}/shared/weight/${token}`,
              token: token,
              expiresAt: expiresAt
            });
          }
        );
      } else {
        // Créer un nouveau token
        db.query(
          'INSERT INTO weight_share_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [userId, token, expiresAt],
          (insertError) => {
            if (insertError) return res.status(500).json({ error: insertError.message });
            res.status(201).json({
              message: 'Token de partage créé avec succès',
              shareUrl: `${req.protocol}://${req.get('host')}/shared/weight/${token}`,
              token: token,
              expiresAt: expiresAt
            });
          }
        );
      }
    }
  );
};

// Récupérer l'historique partagé via token
exports.getSharedWeightHistory = (req, res) => {
  const { token } = req.params;
  
  // Vérifier la validité du token
  db.query(
    'SELECT * FROM weight_share_tokens WHERE token = ? AND expires_at > NOW()',
    [token],
    (error, tokenResults) => {
      if (error) return res.status(500).json({ error: error.message });
      
      if (tokenResults.length === 0) {
        return res.status(404).json({ error: 'Token invalide ou expiré' });
      }
      
      const userId = tokenResults[0].user_id;
      
      // Récupérer les informations de l'utilisateur
      db.query(
        'SELECT * FROM user WHERE id = ?',
        [userId],
        (userError, userResults) => {
          if (userError) return res.status(500).json({ error: userError.message });
          
          if (userResults.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
          }
          
          // Récupérer l'historique de poids
          db.query(
            'SELECT id, poids, photos, date_pesee, date_enregistrement FROM poids WHERE user_id = ? ORDER BY date_pesee DESC',
            [userId],
            (weightError, weightResults) => {
              if (weightError) return res.status(500).json({ error: weightError.message });
              
              // Parser les photos JSON pour chaque entrée
              const weightsWithPhotos = weightResults.map(weight => {
                let photos = [];
                if (weight.photos) {
                  try {
                    photos = JSON.parse(weight.photos);
                  } catch (e) {
                    photos = [];
                  }
                }
                return {
                  ...weight,
                  photos: photos
                };
              });
              
              res.status(200).json({
                userInfo: userResults[0],
                weightHistory: weightsWithPhotos,
                sharedAt: new Date().toISOString()
              });
            }
          );
        }
      );
    }
  );
};

// Révoquer un token de partage
exports.revokeShareToken = (req, res) => {
  const userId = req.params.userId;
  
  db.query(
    'DELETE FROM weight_share_tokens WHERE user_id = ?',
    [userId],
    (error) => {
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ message: 'Token de partage révoqué avec succès' });
    }
  );
};

// Nouvelle fonction pour récupérer l'historique de poids publiquement
exports.getPublicWeightHistory = (req, res) => {
  const userId = req.params.userId;
  
  // Récupérer les informations de l'utilisateur
  db.query(
    'SELECT nom, prenom FROM user WHERE id = ?',
    [userId],
    (error, userResults) => {
      if (error) return res.status(500).json({ error: error.message });
      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const userInfo = userResults[0];
      
      // Récupérer l'historique de poids avec la structure actuelle
      db.query(
        'SELECT * FROM poids WHERE user_id = ? ORDER BY date_enregistrement DESC',
        [userId],
        (error, weightResults) => {
          if (error) return res.status(500).json({ error: error.message });
          
          // Traiter les photos pour chaque enregistrement
          const weightHistory = weightResults.map(record => {
            let photos = [];
            if (record.photos) {
              try {
                photos = JSON.parse(record.photos);
              } catch (e) {
                photos = [];
              }
            }
            return {
              ...record,
              photos: photos
            };
          });
          
          res.json({
            userInfo,
            weightHistory
          });
        }
      );
    }
  );
};