const db = require('../config/db');

// Créer un type d'abonnement
exports.createTypeAbonnement = (req, res) => {
    const { nom, duree_jours, prix, avec_coach } = req.body;
    
    const query = 'INSERT INTO type_abonnement (nom, duree_jours, prix, avec_coach) VALUES (?, ?, ?, ?)';
    
    db.query(query, [nom, duree_jours, prix, avec_coach], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion du type d\'abonnement:', err);
            return res.status(500).json({ error: 'Erreur lors de l\'ajout du type d\'abonnement' });
        }
        res.status(201).json({
            id: result.insertId,
            nom,
            duree_jours,
            prix,
            avec_coach
        });
    });
};

// Récupérer tous les types d'abonnement
exports.getAllTypesAbonnement = (req, res) => {
    const query = 'SELECT * FROM type_abonnement';
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération des types d\'abonnement:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des types d\'abonnement' });
        }
        res.status(200).json(result);
    });
};

// Récupérer un type d'abonnement par ID
exports.getTypeAbonnementById = (req, res) => {
    const { id } = req.params;
    
    const query = 'SELECT * FROM type_abonnement WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération du type d\'abonnement:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération du type d\'abonnement' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Type d\'abonnement non trouvé' });
        }
        res.status(200).json(result[0]);
    });
};

// Mettre à jour un type d'abonnement
exports.updateTypeAbonnement = (req, res) => {
    const { id } = req.params;
    const { nom, duree_jours, prix, avec_coach } = req.body;
    
    const query = 'UPDATE type_abonnement SET nom = ?, duree_jours = ?, prix = ?, avec_coach = ? WHERE id = ?';
    
    db.query(query, [nom, duree_jours, prix, avec_coach, id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du type d\'abonnement:', err);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du type d\'abonnement' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Type d\'abonnement non trouvé' });
        }
        res.status(200).json({
            id,
            nom,
            duree_jours,
            prix,
            avec_coach
        });
    });
};

// Supprimer un type d'abonnement
exports.deleteTypeAbonnement = (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM type_abonnement WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression du type d\'abonnement:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du type d\'abonnement' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Type d\'abonnement non trouvé' });
        }
        res.status(200).json({ message: 'Type d\'abonnement supprimé avec succès' });
    });
};
