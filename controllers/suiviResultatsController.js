// controllers/suiviResultatsController.js
const db = require('../config/db');

exports.createSuiviResultat = async (req, res) => {
  try {
    const {
      user_id,
      date_suivi,
      poids,
      imc,
      tour_taille,
      tour_hanches,
      tour_bras,
      tour_cuisses,
      niveau_energie,
      observations,
      adherence_programme,
      photo_url
    } = req.body;

    const query = `
      INSERT INTO suivi_resultats (
        user_id, date_suivi, poids, imc, tour_taille, tour_hanches, 
        tour_bras, tour_cuisses, niveau_energie, observations, 
        adherence_programme, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      user_id, date_suivi, poids, imc, tour_taille, tour_hanches,
      tour_bras, tour_cuisses, niveau_energie, observations,
      adherence_programme, photo_url
    ], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json({ message: 'Suivi résultat créé avec succès', id: result.insertId });
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSuiviResultatsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT * FROM suivi_resultats
      WHERE user_id = ?
      ORDER BY date_suivi DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Aucun résultat trouvé pour cet utilisateur.' });
      }

      res.json(results);
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
