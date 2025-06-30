const db = require('../config/db');

// ➕ Créer un abonnement
exports.createAbonnement = (req, res) => {
    const { user_id, type_id, date_debut, date_fin, coach_id } = req.body;

    const sql = `INSERT INTO abonnement (user_id, type_id, date_debut, date_fin, coach_id)
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [user_id, type_id, date_debut, date_fin, coach_id], (err, result) => {
        if (err) {
            console.error('Erreur création abonnement:', err);
            return res.status(500).json({ error: 'Erreur création abonnement' });
        }
        res.status(201).json({ message: 'Abonnement créé', id: result.insertId });
    });
};

// 📄 Obtenir tous les abonnements
// Assurez-vous d'importer votre module de base de données


exports.getAllAbonnements = (req, res) => {
    const sql = `
        SELECT 
            a.id AS abonnement_id,
            a.date_debut,
            a.date_fin,

            -- Utilisateur
            u.id AS user_id,
            u.nom AS user_nom,
            u.prenom AS user_prenom,
            u.email AS user_email,

            -- Type d'abonnement
            t.id AS type_id,
            t.nom AS type_nom,
            t.duree_jours,
            t.prix,
            t.avec_coach,

            -- Coach
            c.id AS coach_id,
            c.nom AS coach_nom,
            c.email AS coach_email

        FROM abonnement a
        JOIN user u ON a.user_id = u.id  -- Changer 'users' en 'user'
        JOIN type_abonnement t ON a.type_id = t.id
        LEFT JOIN coach c ON a.coach_id = c.id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur récupération abonnements:', err);
            return res.status(500).json({ error: 'Erreur récupération abonnements' });
        }

        const abonnements = results.map(row => ({
            id: row.abonnement_id,
            date_debut: row.date_debut.toISOString().split('T')[0],
            date_fin: row.date_fin.toISOString().split('T')[0],
            utilisateur: {
                id: row.user_id,
                nom: row.user_nom,
                prenom: row.user_prenom,
                email: row.user_email
            },
            type_abonnement: {
                id: row.type_id,
                nom: row.type_nom,
                duree_jours: row.duree_jours,
                prix: row.prix,
                avec_coach: !!row.avec_coach
            },
            coach: row.coach_id ? {
                id: row.coach_id,
                nom: row.coach_nom,
                email: row.coach_email
            } : null
        }));

        res.status(200).json(abonnements);
    });
};


// 🔍 Obtenir un abonnement par ID
exports.getAbonnementById = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM abonnement WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erreur récupération abonnement:', err);
            return res.status(500).json({ error: 'Erreur récupération abonnement' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Abonnement non trouvé' });
        }
        res.status(200).json(result[0]);
    });
};

// ✏️ Modifier un abonnement
exports.updateAbonnement = (req, res) => {
    const { id } = req.params;
    const { user_id, type_id, date_debut, date_fin, coach_id } = req.body;

    const sql = `UPDATE abonnement 
                 SET user_id = ?, type_id = ?, date_debut = ?, date_fin = ?, coach_id = ?
                 WHERE id = ?`;

    db.query(sql, [user_id, type_id, date_debut, date_fin, coach_id, id], (err, result) => {
        if (err) {
            console.error('Erreur mise à jour abonnement:', err);
            return res.status(500).json({ error: 'Erreur mise à jour abonnement' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Abonnement non trouvé' });
        }
        res.status(200).json({ message: 'Abonnement mis à jour' });
    });
};

// 🗑️ Supprimer un abonnement
exports.deleteAbonnement = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM abonnement WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erreur suppression abonnement:', err);
            return res.status(500).json({ error: 'Erreur suppression abonnement' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Abonnement non trouvé' });
        }
        res.status(200).json({ message: 'Abonnement supprimé' });
    });
};


//get abonnement histrory from user id
exports.getAbonnementHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    // 🛠️ Utiliser .promise() pour les requêtes asynchrones
    const [rows] = await db.promise().query(`
      SELECT *
      FROM vue_abonnements_payes
      WHERE user_id = ?
      ORDER BY date_debut DESC
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Aucun abonnement trouvé pour cet utilisateur." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur lors de la récupération de l’historique des abonnements :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

