// paiementController.js
const db = require('../config/db');

// Enregistrer un paiement en espèces

exports.payerAbonnement = (req, res) => {
    const { abonnement_id, montant, mode_paiement = 'Espèces', is_renewal = false } = req.body;

    // Requête pour récupérer le prix depuis type_abonnement via abonnement
    const sqlCheck = `
        SELECT t.prix, a.user_id, a.type_id, a.date_debut, a.date_fin, a.coach_id 
        FROM abonnement a 
        JOIN type_abonnement t ON a.type_id = t.id 
        WHERE a.id = ?
    `;

    db.query(sqlCheck, [abonnement_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la vérification du montant' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Abonnement introuvable' });
        }

        const prixAbonnement = parseFloat(results[0].prix).toFixed(2);
        const montantPaye = parseFloat(montant).toFixed(2);

        if (prixAbonnement !== montantPaye) {
            return res.status(400).json({ error: 'Le montant payé ne correspond pas exactement au prix de l\'abonnement' });
        }

        // Récupérer les informations de l'abonnement pour l'historique
        const abonnementInfo = results[0];

        // Requête pour insérer le paiement
        const sqlInsertPaiement = `
            INSERT INTO paiement (abonnement_id, montant, date_paiement, mode_paiement)
            VALUES (?, ?, NOW(), ?)
        `;

        db.query(sqlInsertPaiement, [abonnement_id, montantPaye, mode_paiement], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement' });
            }

            // Ajouter l'entrée dans l'historique des abonnements
            const sqlInsertHistorique = `
                INSERT INTO historique_abonnement (user_id, type_id, date_debut, date_fin, coach_id, date_paiment)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            db.query(sqlInsertHistorique, [
                abonnementInfo.user_id,
                abonnementInfo.type_id,
                abonnementInfo.date_debut,
                abonnementInfo.date_fin,
                abonnementInfo.coach_id
            ], (err, histResult) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout à l\'historique:', err);
                    // On continue même si l'historique échoue
                }

                res.status(200).json({ 
                    message: 'Paiement enregistré avec succès',
                    paiement_id: result.insertId,
                    historique_id: histResult ? histResult.insertId : null
                });
            });
        });
    });
};

// Obtenir la liste des paiements
exports.getPaiements = (req, res) => {
    const sql = `
        SELECT p.id, a.id AS abonnement_id, p.montant, p.date_paiement, p.mode_paiement
        FROM paiement p
        JOIN abonnement a ON p.abonnement_id = a.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de récupération des paiements' });
        }
        res.status(200).json(results);
    });
};

// Obtenir la liste des abonnements payés depuis la vue
exports.getAbonnementsPaies = (req, res) => {
    const sql = `SELECT * FROM vue_abonnements_payes`;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de récupération des abonnements payés' });
        }
        res.status(200).json(results);
    });
};

// Obtenir la liste des abonnements non payés depuis la vue
exports.getAbonnementsNonPaies = (req, res) => {
    const sql = `SELECT * FROM vue_abonnements_non_payes`;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de récupération des abonnements non payés' });
        }
        res.status(200).json(results);
    });
};