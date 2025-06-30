const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');


// Créer une commande (client invité)
exports.createCommande = (req, res) => {
  try {
    const {
      nom, prenom, email, telephone,
      adresse_livraison, mode_paiement, notes,
      total, produits
    } = req.body;

    // Validation des données requises
    if (!produits || !Array.isArray(produits) || produits.length === 0) {
      return res.status(400).json({ error: 'Les produits sont requis et doivent être un tableau non vide' });
    }

    // ✅ Génération d'une référence plus unique
    const reference = 'CMD-' + uuidv4().slice(0, 8).toUpperCase();

    const insertCommande = `
      INSERT INTO commande
      (reference, nom, prenom, email, telephone, adresse_livraison, mode_paiement, notes, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertCommande, [
      reference, nom, prenom, email, telephone,
      adresse_livraison, mode_paiement, notes, total
    ], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur création commande' });
      }

      const commandeId = result.insertId;

      const items = produits.map(p => [commandeId, p.produit_id, p.quantite, p.prix_unitaire]);
      const insertItems = `INSERT INTO commande_item (commande_id, produit_id, quantite, prix_unitaire) VALUES ?`;

      db.query(insertItems, [items], (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: 'Erreur ajout des articles' });
        }

        const insertStatut = `INSERT INTO commande_statut (commande_id, statut) VALUES (?, 'en_attente')`;
        db.query(insertStatut, [commandeId], (err3) => {
          if (err3) {
            console.error(err3);
            return res.status(500).json({ error: 'Erreur ajout statut' });
          }

          res.status(201).json({ message: 'Commande enregistrée', reference });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
// Récupérer toutes les commandes
exports.getAllCommandes = (req, res) => {
  try {
    const query = `SELECT * FROM commande ORDER BY date_commande DESC`;
    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ error: 'Erreur récupération' });
      res.json(result);
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Détails d'une commande par ID
exports.getCommandeDetails = (req, res) => {
  try {
    const { id } = req.params;

    const getCommande = `SELECT * FROM commande WHERE id = ?`;
    const getItems = `SELECT ci.*, p.nom FROM commande_item ci JOIN produits p ON ci.produit_id = p.id WHERE commande_id = ?`;
    const getStatuts = `SELECT * FROM commande_statut WHERE commande_id = ? ORDER BY date_statut ASC`;

    db.query(getCommande, [id], (err1, commande) => {
      if (err1 || commande.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

      db.query(getItems, [id], (err2, items) => {
        if (err2) return res.status(500).json({ error: 'Erreur chargement produits' });

        db.query(getStatuts, [id], (err3, statuts) => {
          if (err3) return res.status(500).json({ error: 'Erreur chargement statuts' });

          res.json({ commande: commande[0], items, statuts });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


exports.getCommandeDetailsbyReference = (req, res) => {
  try {
    const { id } = req.params;

    const getCommande = `SELECT * FROM commande WHERE reference = ?`;
    const getItems = `SELECT ci.*, p.nom FROM commande_item ci JOIN produits p ON ci.produit_id = p.id WHERE commande_id = ?`;
    const getStatuts = `SELECT * FROM commande_statut WHERE commande_id = ? ORDER BY date_statut ASC`;

    db.query(getCommande, [id], (err1, commande) => {
      if (err1 || commande.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

      db.query(getItems, [id], (err2, items) => {
        if (err2) return res.status(500).json({ error: 'Erreur chargement produits' });

        db.query(getStatuts, [id], (err3, statuts) => {
          if (err3) return res.status(500).json({ error: 'Erreur chargement statuts' });

          res.json({ commande: commande[0], items, statuts });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



// Validation des transitions de statut autorisées
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'en_attente': ['validée', 'annulée'],
    'validée': ['en_preparation', 'annulée'],
    'en_preparation': ['expédiée'],
    'expédiée': ['livrée'],
    'livrée': [], // État final
    'annulée': [] // État final
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Mettre à jour le stock des produits lors de l'expédition
const updateProductStock = (commandeId, callback) => {
  const getItems = `SELECT produit_id, quantite FROM commande_item WHERE commande_id = ?`;
  
  db.query(getItems, [commandeId], (err, items) => {
    if (err) return callback(err);
    
    let completed = 0;
    const total = items.length;
    
    if (total === 0) return callback(null);
    
    items.forEach(item => {
      const updateStock = `UPDATE produits SET quantite = quantite - ? WHERE id = ? AND quantite >= ?`;
      
      db.query(updateStock, [item.quantite, item.produit_id, item.quantite], (err, result) => {
        if (err) return callback(err);
        
        if (result.affectedRows === 0) {
          return callback(new Error(`Stock insuffisant pour le produit ID ${item.produit_id}`));
        }
        
        completed++;
        if (completed === total) {
          callback(null);
        }
      });
    });
  });
};

// Modifier le statut d'une commande
exports.updateCommandeStatut = (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    // Validation du statut
    const validStatuses = ['en_attente', 'validée', 'en_preparation', 'expédiée', 'livrée', 'annulée'];
    if (!validStatuses.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    // Récupérer le statut actuel de la commande
    const getCurrentStatus = `SELECT statut FROM commande WHERE id = ?`;
    
    db.query(getCurrentStatus, [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Erreur récupération commande' });
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Commande introuvable' });
      }
      
      const currentStatus = result[0].statut;
      
      // Validation de la transition
      if (!validateStatusTransition(currentStatus, statut)) {
        return res.status(400).json({ 
          error: `Transition non autorisée de '${currentStatus}' vers '${statut}'` 
        });
      }
      
      // Si passage à 'expédiée', vérifier et mettre à jour les stocks
      if (statut === 'expédiée') {
        updateProductStock(id, (stockErr) => {
          if (stockErr) {
            return res.status(400).json({ error: stockErr.message });
          }
          
          // Procéder à la mise à jour du statut
          updateCommandeStatus();
        });
      } else {
        // Mise à jour directe du statut
        updateCommandeStatus();
      }
      
      function updateCommandeStatus() {
        const insertStatut = `INSERT INTO commande_statut (commande_id, statut) VALUES (?, ?)`;
        const updateCommande = `UPDATE commande SET statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        
        db.query(insertStatut, [id, statut], (err1) => {
          if (err1) return res.status(500).json({ error: 'Erreur ajout statut' });
          
          db.query(updateCommande, [statut, id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Erreur mise à jour statut' });
            
            res.json({ 
              message: 'Statut mis à jour avec succès',
              previousStatus: currentStatus,
              newStatus: statut,
              stockUpdated: statut === 'expédiée'
            });
          });
        });
      }
    });
  } catch (err) {
    console.error('Erreur updateCommandeStatut:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
