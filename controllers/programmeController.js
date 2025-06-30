const db = require('../config/db');

// Créer un programme (sans vérification coach)
exports.createProgramme = (req, res) => {
    const { user_id, coach_id, nom, description } = req.body;
    
    // Validation basique
    if (!user_id || !coach_id || !nom) {
        return res.status(400).json({ error: 'Champs requis: user_id, coach_id, nom' });
    }

    const sql = `
        INSERT INTO programmes 
        (user_id, coach_id, nom, description)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [user_id, coach_id, nom, description || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            message: 'Programme créé',
            programme_id: result.insertId 
        });
    });
};

// Ajouter un jour d'entraînement
exports.addJour = (req, res) => {
    const { programme_id, jour, titre, notes } = req.body;
    
    const sql = `
        INSERT INTO jours_entrainement 
        (programme_id, jour, titre, notes)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [programme_id, jour, titre || null, notes || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            message: 'Jour ajouté',
            jour_id: result.insertId 
        });
    });
};

// Ajouter un exercice
exports.addExercice = (req, res) => {
    const { jour_id, nom, description, muscle_cible, sets, repetitions, poids, temps_repos, ordre } = req.body;
    
    const sql = `
        INSERT INTO exercices 
        (jour_id, nom, description, muscle_cible, sets, repetitions, poids, temps_repos, ordre)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [jour_id, nom, description || null, muscle_cible || null, sets, repetitions, poids || null, temps_repos, ordre || 1], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            message: 'Exercice ajouté',
            exercice_id: result.insertId 
        });
    });
};

// Ajouter un média
exports.addMedia = (req, res) => {
    const { exercice_id, type, url } = req.body;
    
    const sql = `
        INSERT INTO medias 
        (exercice_id, type, url)
        VALUES (?, ?, ?)
    `;
    
    db.query(sql, [exercice_id, type, url], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            message: 'Média ajouté',
            media_id: result.insertId 
        });
    });
};

// Modifier un exercice
exports.updateExercice = (req, res) => {
    const exerciceId = req.params.exerciceId;
    const { nom, description, muscle_cible, sets, repetitions, poids, temps_repos, ordre } = req.body;
    
    const sql = `
        UPDATE exercices 
        SET nom = ?, description = ?, muscle_cible = ?, sets = ?, repetitions = ?, poids = ?, temps_repos = ?, ordre = ?
        WHERE id = ?
    `;
    
    db.query(sql, [nom, description, muscle_cible, sets, repetitions, poids, temps_repos, ordre, exerciceId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Exercice non trouvé' });
        }
        res.json({ message: 'Exercice modifié avec succès' });
    });
};

// Supprimer un jour d'entraînement
exports.deleteJour = (req, res) => {
    const jourId = req.params.jourId;
    
    const sql = 'DELETE FROM jours_entrainement WHERE id = ?';
    
    db.query(sql, [jourId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Jour d\'entraînement non trouvé' });
        }
        res.json({ message: 'Jour d\'entraînement supprimé avec succès' });
    });
};

// Supprimer un exercice
exports.deleteExercice = (req, res) => {
    const exerciceId = req.params.exerciceId;
    
    const sql = 'DELETE FROM exercices WHERE id = ?';
    
    db.query(sql, [exerciceId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Exercice non trouvé' });
        }
        res.json({ message: 'Exercice supprimé avec succès' });
    });
};

// Supprimer un média
exports.deleteMedia = (req, res) => {
    const mediaId = req.params.mediaId;
    
    const sql = 'DELETE FROM medias WHERE id = ?';
    
    db.query(sql, [mediaId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Média non trouvé' });
        }
        res.json({ message: 'Média supprimé avec succès' });
    });
};

// Obtenir les programmes d'un utilisateur
exports.getProgrammesByUser = (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT p.id, p.nom, p.description, p.created_at,
               c.nom AS coach_nom, c.prenom AS coach_prenom
        FROM programmes p
        LEFT JOIN coach c ON p.coach_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `;
    
    db.query(sql, [userId], (err, programmes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (programmes.length === 0) {
            return res.status(404).json({ 
                message: `Aucun programme trouvé pour l'utilisateur ID ${userId}` 
            });
        }
        
        res.json(programmes);
    });
};

// Obtenir les détails d'un programme
exports.getProgrammeDetails = (req, res) => {
    const programmeId = req.params.programmeId;
    
    // Requête pour obtenir le programme
    const programmeSql = `
        SELECT p.*, u.nom AS user_nom, u.prenom AS user_prenom,
               c.nom AS coach_nom, c.prenom AS coach_prenom
        FROM programmes p
        LEFT JOIN user u ON p.user_id = u.id
        LEFT JOIN user c ON p.coach_id = c.id
        WHERE p.id = ?
    `;
    
    db.query(programmeSql, [programmeId], (err, programmes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (programmes.length === 0) {
            return res.status(404).json({ error: 'Programme non trouvé' });
        }
        
        const programme = programmes[0];
        
        // Requête pour obtenir les jours d'entraînement avec exercices et médias
        const joursSql = `
            SELECT j.id AS jour_id, j.jour, j.titre AS jour_titre, j.notes AS jour_notes,
                   e.id AS exercice_id, e.nom AS exercice_nom, e.description AS exercice_description,
                   e.muscle_cible, e.sets, e.repetitions, e.poids, e.temps_repos, e.ordre,
                   m.id AS media_id, m.type AS media_type, m.url AS media_url
            FROM jours_entrainement j
            LEFT JOIN exercices e ON j.id = e.jour_id
            LEFT JOIN medias m ON e.id = m.exercice_id
            WHERE j.programme_id = ?
            ORDER BY j.jour, e.ordre, m.id
        `;
        
        db.query(joursSql, [programmeId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Organiser les données
            const joursMap = new Map();
            
            rows.forEach(row => {
                // Créer le jour s'il n'existe pas
                if (!joursMap.has(row.jour_id)) {
                    joursMap.set(row.jour_id, {
                        id: row.jour_id,
                        jour: row.jour,
                        titre: row.jour_titre,
                        notes: row.jour_notes,
                        exercices: new Map()
                    });
                }
                
                const jour = joursMap.get(row.jour_id);
                
                // Ajouter l'exercice s'il existe et n'est pas déjà ajouté
                if (row.exercice_id && !jour.exercices.has(row.exercice_id)) {
                    jour.exercices.set(row.exercice_id, {
                        id: row.exercice_id,
                        jour_id: row.jour_id,
                        nom: row.exercice_nom,
                        description: row.exercice_description,
                        muscle_cible: row.muscle_cible,
                        sets: row.sets,
                        repetitions: row.repetitions,
                        poids: row.poids,
                        temps_repos: row.temps_repos,
                        ordre: row.ordre,
                        medias: []
                    });
                }
                
                // Ajouter le média s'il existe
                if (row.media_id && row.exercice_id) {
                    const exercice = jour.exercices.get(row.exercice_id);
                    if (exercice) {
                        exercice.medias.push({
                            id: row.media_id,
                            type: row.media_type,
                            url: row.media_url
                        });
                    }
                }
            });
            
            // Convertir les Maps en arrays
            const jours = Array.from(joursMap.values()).map(jour => ({
                ...jour,
                exercices: Array.from(jour.exercices.values())
            }));
            
            res.json({
                ...programme,
                jours
            });
        });
    });
};

// Supprimer un programme
exports.deleteProgramme = (req, res) => {
    const programmeId = req.params.programmeId;
    
    const sql = 'DELETE FROM programmes WHERE id = ?';
    
    db.query(sql, [programmeId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Programme non trouvé' });
        }
        res.json({ message: 'Programme supprimé avec succès' });
    });
};

// Obtenir les programmes par coach ID
exports.getProgrammesByCoachId = (req, res) => {
    const coachId = req.params.coachId;
    
    const sql = `
        SELECT p.id, p.nom, p.description, p.created_at,
               u.id AS user_id, u.nom AS user_nom, u.prenom AS user_prenom
        FROM programmes p
        JOIN user u ON p.user_id = u.id
        WHERE p.coach_id = ?
        ORDER BY p.created_at DESC
    `;
    
    db.query(sql, [coachId], (err, programmes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (programmes.length === 0) {
            return res.status(404).json({ 
                message: `Aucun programme trouvé pour le coach ID ${coachId}` 
            });
        }
        
        // Compter le nombre d'exercices par programme
        const getExercicesCount = (programmeId) => {
            return new Promise((resolve, reject) => {
                const countSql = `
                    SELECT COUNT(e.id) AS exercices_count
                    FROM programmes p
                    JOIN jours_entrainement j ON p.id = j.programme_id
                    JOIN exercices e ON j.id = e.jour_id
                    WHERE p.id = ?
                `;
                
                db.query(countSql, [programmeId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result[0]?.exercices_count || 0);
                });
            });
        };
        
        // Enrichir chaque programme avec le nombre d'exercices
        Promise.all(programmes.map(async (programme) => {
            const exercicesCount = await getExercicesCount(programme.id);
            return {
                ...programme,
                exercices_count: exercicesCount
            };
        }))
        .then(enrichedProgrammes => {
            res.json(enrichedProgrammes);
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
    });
};
