const db = require('../config/db');

// ➕ Créer un rappel
exports.createReminder = (req, res) => {
    const { user_id, day_of_week, time, title, notify } = req.body;

    const sql = `INSERT INTO reminder (user_id, day_of_week, time, title, notify)
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [user_id, day_of_week, time, title, notify], (err, result) => {
        if (err) {
            console.error('Erreur création rappel:', err);
            return res.status(500).json({ error: 'Erreur lors de la création du rappel' });
        }
        res.status(201).json({ message: 'Rappel créé', id: result.insertId });
    });
};

// 📄 Obtenir tous les rappels
exports.getAllReminders = (req, res) => {
    const sql = `SELECT * FROM reminder`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur récupération rappels:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des rappels' });
        }

        res.status(200).json(results);
    });
};

// 📄 Obtenir les rappels d'un utilisateur spécifique
exports.getRemindersByUserId = (req, res) => {
    const { userId } = req.params;
    const sql = `SELECT * FROM reminder WHERE user_id = ? ORDER BY day_of_week, time`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Erreur récupération rappels utilisateur:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des rappels' });
        }

        res.status(200).json(results);
    });
};

// 🔍 Obtenir un rappel par ID
exports.getReminderById = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM reminder WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erreur récupération rappel:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération du rappel' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Rappel non trouvé' });
        }
        res.status(200).json(result[0]);
    });
};

// ✏️ Modifier un rappel
exports.updateReminder = (req, res) => {
    const { id } = req.params;
    const { user_id, day_of_week, time, title, notify } = req.body;

    const sql = `UPDATE reminder 
                 SET user_id = ?, day_of_week = ?, time = ?, title = ?, notify = ?
                 WHERE id = ?`;

    db.query(sql, [user_id, day_of_week, time, title, notify, id], (err, result) => {
        if (err) {
            console.error('Erreur mise à jour rappel:', err);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du rappel' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Rappel non trouvé' });
        }
        res.status(200).json({ message: 'Rappel mis à jour' });
    });
};

// 🗑️ Supprimer un rappel
exports.deleteReminder = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM reminder WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erreur suppression rappel:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du rappel' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Rappel non trouvé' });
        }
        res.status(200).json({ message: 'Rappel supprimé' });
    });
};
