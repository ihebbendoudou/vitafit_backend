const db = require('../config/db');

// Créer une consultation (user ou guest)
exports.createConsultation = async (req, res) => {
  try {
    const {
      type, user_id, guest_id, motif, date_souhaitee, heure_souhaitee
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO consultations (type, user_id, guest_id, motif, date_souhaitee, heure_souhaitee, statut)
      VALUES (?, ?, ?, ?, ?, ?, 'en_attente')
    `, [type, user_id || null, guest_id || null, motif, date_souhaitee, heure_souhaitee]);

    res.status(201).json({ message: "Consultation demandée", id: result.insertId });
  } catch (error) {
    console.error("Erreur création consultation :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Obtenir toutes les consultations
exports.getAllConsultations = (req, res) => {
  const sql = `
    SELECT 
      c.*,
      u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
      g.nom AS guest_nom, g.prenom AS guest_prenom, g.email AS guest_email,
      m.nom AS medecin_nom, m.specialite AS medecin_specialite
    FROM consultations c
    LEFT JOIN user u ON c.user_id = u.id
    LEFT JOIN guests g ON c.guest_id = g.id
    LEFT JOIN medecins m ON c.medecin_id = m.id
    ORDER BY c.created_at DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Erreur lors du chargement des consultations:', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json(results);
  });
};

// Obtenir les consultations par statut
exports.getConsultationsByStatus = (req, res) => {
  const { statut } = req.params;
  
  const validStatuts = ['en_attente', 'approuve_admin', 'en_attente_medecin', 'valide', 'refuse'];
  if (!validStatuts.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }

  const sql = `
    SELECT 
      c.*,
      u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
      g.nom AS guest_nom, g.prenom AS guest_prenom, g.email AS guest_email,
      m.nom AS medecin_nom, m.specialite AS medecin_specialite
    FROM consultations c
    LEFT JOIN user u ON c.user_id = u.id
    LEFT JOIN guests g ON c.guest_id = g.id
    LEFT JOIN medecins m ON c.medecin_id = m.id
    WHERE c.statut = ?
    ORDER BY c.created_at DESC
  `;

  db.query(sql, [statut], (error, results) => {
    if (error) {
      console.error('Erreur lors du chargement des consultations par statut:', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json(results);
  });
};

// Obtenir une consultation par ID
exports.getConsultationById = (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT * FROM consultations WHERE id = ?',
    [id],
    (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération de la consultation :', error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Consultation introuvable" });
      }

      res.status(200).json(results[0]);
    }
  );
};

// Mettre à jour une consultation (statut ou affectation médecin)
exports.updateConsultation = (req, res) => {
  const { id } = req.params;
  const {
    approuve_admin, approuve_medecin, medecin_id,
    commentaire_admin, commentaire_medecin, date_consultation
  } = req.body;

  // Déterminer le nouveau statut selon le cycle de vie
  let nouveauStatut = 'en_attente';
  
  if (approuve_admin === false) {
    // Si admin refuse, statut = refuse
    nouveauStatut = 'refuse';
  } else if (approuve_admin === true) {
    if (approuve_medecin === false) {
      // Si admin approuve mais médecin refuse, statut = refuse
      nouveauStatut = 'refuse';
    } else if (approuve_medecin === true) {
      // Si admin et médecin approuvent, statut = valide
      nouveauStatut = 'valide';
    } else {
      // Si admin approuve mais médecin pas encore décidé, statut = en_attente_medecin
      nouveauStatut = 'en_attente_medecin';
    }
  }

  const sql = `
    UPDATE consultations
    SET approuve_admin = ?, approuve_medecin = ?, medecin_id = ?, 
        commentaire_admin = ?, commentaire_medecin = ?, date_consultation = ?, statut = ?
    WHERE id = ?
  `;

  const values = [
    approuve_admin ?? false,
    approuve_medecin ?? false,
    medecin_id || null,
    commentaire_admin || null,
    commentaire_medecin || null,
    date_consultation || null,
    nouveauStatut,
    id
  ];

  db.query(sql, values, (error) => {
    if (error) {
      console.error('Erreur lors de la mise à jour de la consultation :', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json({ 
      message: "Consultation mise à jour", 
      statut: nouveauStatut 
    });
  });
};

// Approuver une consultation par l'admin
exports.approveByAdmin = (req, res) => {
  const { id } = req.params;
  const { commentaire_admin, medecin_id } = req.body;

  const sql = `
    UPDATE consultations
    SET approuve_admin = true, commentaire_admin = ?, medecin_id = ?, statut = 'en_attente_medecin'
    WHERE id = ?
  `;

  db.query(sql, [commentaire_admin || null, medecin_id || null, id], (error) => {
    if (error) {
      console.error('Erreur lors de l\'approbation par l\'admin :', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json({ 
      message: "Consultation approuvée par l'admin", 
      statut: 'en_attente_medecin' 
    });
  });
};

// Refuser une consultation par l'admin
exports.rejectByAdmin = (req, res) => {
  const { id } = req.params;
  const { commentaire_admin } = req.body;

  const sql = `
    UPDATE consultations
    SET approuve_admin = false, commentaire_admin = ?, statut = 'refuse'
    WHERE id = ?
  `;

  db.query(sql, [commentaire_admin || null, id], (error) => {
    if (error) {
      console.error('Erreur lors du refus par l\'admin :', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json({ 
      message: "Consultation refusée par l'admin", 
      statut: 'refuse' 
    });
  });
};

// Approuver une consultation par le médecin
exports.approveByMedecin = (req, res) => {
  const { id } = req.params;
  const { commentaire_medecin, date_consultation } = req.body;

  const sql = `
    UPDATE consultations
    SET approuve_medecin = true, commentaire_medecin = ?, date_consultation = ?, statut = 'valide'
    WHERE id = ? AND approuve_admin = true
  `;

  db.query(sql, [commentaire_medecin || null, date_consultation || null, id], (error, result) => {
    if (error) {
      console.error('Erreur lors de l\'approbation par le médecin :', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Consultation non trouvée ou non approuvée par l'admin" });
    }

    res.status(200).json({ 
      message: "Consultation validée par le médecin", 
      statut: 'valide' 
    });
  });
};

// Refuser une consultation par le médecin
exports.rejectByMedecin = (req, res) => {
  const { id } = req.params;
  const { commentaire_medecin } = req.body;

  const sql = `
    UPDATE consultations
    SET approuve_medecin = false, commentaire_medecin = ?, statut = 'refuse'
    WHERE id = ? AND approuve_admin = true
  `;

  db.query(sql, [commentaire_medecin || null, id], (error, result) => {
    if (error) {
      console.error('Erreur lors du refus par le médecin :', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Consultation non trouvée ou non approuvée par l'admin" });
    }

    res.status(200).json({ 
      message: "Consultation refusée par le médecin", 
      statut: 'refuse' 
    });
  });
};

// Obtenir les consultations par médecin ID
exports.getConsultationsByMedecinId = (req, res) => {
  const { medecinId } = req.params;
  
  const sql = `
    SELECT 
      c.*,
      u.nom AS user_nom, u.prenom AS user_prenom, u.email AS user_email,
      g.nom AS guest_nom, g.prenom AS guest_prenom, g.email AS guest_email,
      m.nom AS medecin_nom, m.specialite AS medecin_specialite
    FROM consultations c
    LEFT JOIN user u ON c.user_id = u.id
    LEFT JOIN guests g ON c.guest_id = g.id
    LEFT JOIN medecins m ON c.medecin_id = m.id
    WHERE c.medecin_id = ? AND c.statut IN ('en_attente_medecin', 'valide', 'refuse')
    ORDER BY c.created_at DESC
  `;

  db.query(sql, [medecinId], (error, results) => {
    if (error) {
      console.error('Erreur lors du chargement des consultations du médecin:', error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.status(200).json(results);
  });
};

// Supprimer une consultation
exports.deleteConsultation = (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM consultations WHERE id = ?',
    [id],
    (error, result) => {
      if (error) {
        console.error('Erreur lors de la suppression de la consultation :', error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      res.status(200).json({ message: "Consultation supprimée" });
    }
  );
};

exports.requestConsultationByGuest = (req, res) => {
  const { nom, prenom, email, telephone, objet, medecin_id, date_demande } = req.body;

  if (!nom || !email || !objet) {
    return res.status(400).json({ error: "Les champs nom, email et objet sont obligatoires." });
  }

  // Étape 1 : Vérifier si le guest existe
  db.query('SELECT * FROM guests WHERE email = ?', [email], (err, existing) => {
    if (err) {
      console.error("Erreur lors de la vérification du guest :", err);
      return res.status(500).json({ error: "Erreur serveur lors de la demande de consultation." });
    }

    let guestId;
    
    if (existing.length > 0) {
      // Guest existe déjà
      guestId = existing[0].id;
      createConsultation();
    } else {
      // Étape 2 : Créer un nouveau guest
      db.query(
        'INSERT INTO guests (nom, prenom, email, telephone) VALUES (?, ?, ?, ?)',
        [nom, prenom, email, telephone],
        (err, result) => {
          if (err) {
            console.error("Erreur lors de la création du guest :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la demande de consultation." });
          }
          guestId = result.insertId;
          createConsultation();
        }
      );
    }

    // Fonction pour créer la consultation
    function createConsultation() {
      const medecinIdValue = medecin_id && medecin_id !== '' ? medecin_id : null;
      const dateDemande = date_demande ;
      db.query(
        `INSERT INTO consultations (type, guest_id, objet, medecin_id, date_demande, statut) VALUES ('internaute', ?, ?, ?, ?, 'en_attente')`,
        [guestId, objet, medecinIdValue, dateDemande],
        (err, result) => {
          if (err) {
            console.error("Erreur lors de la création de la consultation :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la demande de consultation." });
          }
          res.status(201).json({ message: "Consultation demandée avec succès." });
        }
      );
    }
  });
};

exports.requestConsultationByUser = (req, res) => {
  const user_id = req.user.id; // supposé que le middleware JWT ajoute l'utilisateur
  const { objet, medecin_id, date_demande } = req.body;

  if (!objet || !user_id) {
    return res.status(400).json({ error: "Objet de la consultation requis." });
  }

  const medecinIdValue = medecin_id && medecin_id !== '' ? medecin_id : null;
  const dateDemande = date_demande || null;

  const sql = `
    INSERT INTO consultations (type, user_id, objet, medecin_id, date_demande, statut)
    VALUES ('adherent', ?, ?, ?, ?, 'en_attente')
  `;

  db.query(sql, [user_id, objet, medecinIdValue, dateDemande], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'enregistrement de la consultation :", err);
      return res.status(500).json({ error: "Impossible d'enregistrer la consultation." });
    }
    res.status(201).json({ message: "Consultation enregistrée avec succès." });
  });
};
