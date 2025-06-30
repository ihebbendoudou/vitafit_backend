const db = require('../config/db');

// 🟢 Créer
exports.createFullHealthData = (req, res) => {
  const diagnostic = req.body;
  const habitude = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err });

    const diagData = {
      user_id: diagnostic.user_id,
      imc: diagnostic.imc,
      tour_taille: diagnostic.tour_taille,
      tour_hanches: diagnostic.tour_hanches,
      tour_bras: diagnostic.tour_bras,
      tour_cuisses: diagnostic.tour_cuisses,
      graisse_corporelle: diagnostic.graisse_corporelle,
      masse_musculaire: diagnostic.masse_musculaire,
      hydratation: diagnostic.hydratation,
      tension_arterielle: diagnostic.tension_arterielle,
      frequence_cardiaque: diagnostic.frequence_cardiaque,
      glycemie: diagnostic.glycemie,
      ferritine: diagnostic.ferritine,
      cholesterol: diagnostic.cholesterol,
      activite_physique: diagnostic.activite_physique,
      pathologies: diagnostic.pathologies
    };

    const habData = {
      user_id: habitude.user_id,
      sommeil_heures: habitude.sommeil_heures,
      qualite_sommeil: habitude.qualite_sommeil,
      stress: habitude.stress,
      hydratation_litres: habitude.hydratation_litres,
      journal_alimentaire: habitude.journal_alimentaire,
      score_conformite_alimentaire: habitude.score_conformite_alimentaire,
      activite_physique_type: habitude.activite_physique_type,
      frequence_activite: habitude.frequence_activite,
      duree_activite_minutes: habitude.duree_activite_minutes
    };

    db.query('INSERT INTO diagnostic_initial SET ?', diagData, (err) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err }));

      db.query('INSERT INTO habitudes SET ?', habData, (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err }));

        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err }));
          res.json({ message: 'Données enregistrées avec succès' });
        });
      });
    });
  });
};

// 🔵 Lire
exports.getFullHealthByUserId = (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT d.*, h.date_enregistrement, h.sommeil_heures, h.qualite_sommeil,
           h.stress, h.hydratation_litres, h.journal_alimentaire, 
           h.score_conformite_alimentaire, h.activite_physique_type, 
           h.frequence_activite, h.duree_activite_minutes
    FROM diagnostic_initial d
    JOIN habitudes h ON d.user_id = h.user_id
    WHERE d.user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0] || {});
  });
};

// 🟡 Mettre à jour
exports.updateFullHealthByUserId = (req, res) => {
  const userId = req.params.userId;
  const data = req.body;

  const diagUpdate = {
    imc: data.imc,
    tour_taille: data.tour_taille,
    tour_hanches: data.tour_hanches,
    tour_bras: data.tour_bras,
    tour_cuisses: data.tour_cuisses,
    graisse_corporelle: data.graisse_corporelle,
    masse_musculaire: data.masse_musculaire,
    hydratation: data.hydratation,
    tension_arterielle: data.tension_arterielle,
    frequence_cardiaque: data.frequence_cardiaque,
    glycemie: data.glycemie,
    ferritine: data.ferritine,
    cholesterol: data.cholesterol,
    activite_physique: data.activite_physique,
    pathologies: data.pathologies
  };

  const habUpdate = {
    sommeil_heures: data.sommeil_heures,
    qualite_sommeil: data.qualite_sommeil,
    stress: data.stress,
    hydratation_litres: data.hydratation_litres,
    journal_alimentaire: data.journal_alimentaire,
    score_conformite_alimentaire: data.score_conformite_alimentaire,
    activite_physique_type: data.activite_physique_type,
    frequence_activite: data.frequence_activite,
    duree_activite_minutes: data.duree_activite_minutes
  };

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err });

    db.query('UPDATE diagnostic_initial SET ? WHERE user_id = ?', [diagUpdate, userId], (err) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err }));

      db.query('UPDATE habitudes SET ? WHERE user_id = ?', [habUpdate, userId], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err }));

        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err }));
          res.json({ message: 'Mise à jour réussie' });
        });
      });
    });
  });
};

// 🔴 Supprimer
exports.deleteFullHealthByUserId = (req, res) => {
  const userId = req.params.userId;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err });

    db.query('DELETE FROM diagnostic_initial WHERE user_id = ?', [userId], (err) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err }));

      db.query('DELETE FROM habitudes WHERE user_id = ?', [userId], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err }));

        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err }));
          res.json({ message: 'Données supprimées' });
        });
      });
    });
  });
};
