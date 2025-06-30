const db = require('../config/db');

// ➕ CREATE un suivi médical
exports.createSuivi = (req, res) => {
  const { user_id, medecin_id, diagnostic, recommandations } = req.body;
  const sql = `
    INSERT INTO suivi_medical (user_id, medecin_id, diagnostic, recommandations)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [user_id, medecin_id, diagnostic, recommandations], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Suivi médical créé', id: result.insertId });
  });
};

// 📖 READ tous les suivis
exports.getAllSuivis = (req, res) => {
  const sql = `
    SELECT sm.*, u.nom AS user_nom, m.nom AS medecin_nom
    FROM suivi_medical sm
    JOIN user u ON sm.user_id = u.id
    JOIN medecins m ON sm.medecin_id = m.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 📖 READ un suivi par ID
exports.getSuiviById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT sm.*, u.nom AS user_nom, m.nom AS medecin_nom
    FROM suivi_medical sm
    JOIN user u ON sm.user_id = u.id
    JOIN medecins m ON sm.medecin_id = m.id
    WHERE sm.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Suivi non trouvé' });
    res.json(results[0]);
  });
};

// ✏️ UPDATE un suivi médical
exports.updateSuivi = (req, res) => {
  const { id } = req.params;
  const { diagnostic, recommandations } = req.body;
  const sql = `
    UPDATE suivi_medical
    SET diagnostic = ?, recommandations = ?
    WHERE id = ?
  `;
  db.query(sql, [diagnostic, recommandations, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Suivi mis à jour' });
  });
};

// ❌ DELETE un suivi médical
exports.deleteSuivi = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM suivi_medical WHERE id = ?`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Suivi supprimé' });
  });
};




// Get patients by doctor ID

exports.getUsersByMedecinId = (req, res) => {
  const { medecinId } = req.params;

  const query = `
    SELECT *
    FROM adherents_avec_suivi_medical_complet
    WHERE medecin_id = ?
  `;

  db.query(query, [medecinId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No users found for this medecin ID.' });
    }

    res.json(results);
  });
};

// Get all patients with medical follow-up (for coaches and admins)
exports.getAllPatientsWithSuivi = (req, res) => {
  const query = `
    SELECT *
    FROM adherents_avec_suivi_medical_complet
    ORDER BY date_suivi DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.json(results);
  });
};

// Get patients with medical follow-up for a specific coach
exports.getPatientsByCoachId = (req, res) => {
  const coachId = req.params.coachId;
  
  if (!coachId) {
    return res.status(400).json({ message: 'Coach ID is required' });
  }

  const query = `
    SELECT sm.*
    FROM adherents_avec_suivi_medical_complet sm
    INNER JOIN vue_users_avec_coach uc ON sm.user_id = uc.user_id
    WHERE uc.coach_id = ?
    ORDER BY sm.date_suivi DESC
  `;

  db.query(query, [coachId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No patients found for this coach ID.' });
    }

    res.json(results);
  });
};