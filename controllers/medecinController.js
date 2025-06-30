const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// GET all medecins
exports.getAllMedecins = (req, res) => {
    db.query('SELECT * FROM medecins', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

// GET medecin by ID
exports.getMedecinById = (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM medecins WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length === 0) return res.status(404).json({ message: 'Médecin non trouvé' });
        res.json(result[0]);
    });
};

// POST create new medecin
exports.createMedecin = (req, res) => {
    const { nom, specialite, telephone, email, adresse, password } = req.body;
    console.log('🔧 Reçu pour création :', req.body);

    // Hacher le mot de passe
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('❌ Erreur lors du hash du mot de passe :', err);
            return res.status(500).json({ message: 'Erreur lors du traitement du mot de passe.', error: err });
        }

        const sql = 'INSERT INTO medecins (nom, specialite, telephone, email, adresse, password) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [nom, specialite, telephone, email, adresse, hashedPassword];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('❌ Erreur lors de la création du médecin :', err);
                return res.status(500).json({ message: 'Erreur lors de la création du médecin.', error: err });
            }

            console.log('✅ Médecin créé avec ID :', result.insertId);
            res.status(201).json({ 
                id: result.insertId, 
                nom, 
                specialite, 
                telephone, 
                email, 
                adresse,
                message: 'Médecin créé avec succès'
            });
        });
    });
};

// PUT update medecin
exports.updateMedecin = (req, res) => {
    const { id } = req.params;
    const { nom, specialite, telephone, email, adresse, password } = req.body;

    console.log(`🔄 Mise à jour du médecin ID ${id} avec :`, req.body);

    // Récupérer le médecin existant d'abord
    db.query('SELECT * FROM medecins WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération du médecin :', err);
            return res.status(500).json({ message: 'Erreur serveur.', error: err });
        }

        if (results.length === 0) {
            console.warn('⚠️ Médecin non trouvé pour mise à jour.');
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }

        const existingMedecin = results[0];
        
        // Fonction pour exécuter la mise à jour
        const executeUpdate = (hashedPassword) => {
            const sql = `
                UPDATE medecins 
                SET nom = ?, specialite = ?, telephone = ?, email = ?, adresse = ?, password = ?
                WHERE id = ?
            `;
            const values = [nom, specialite, telephone, email, adresse, hashedPassword, id];
            
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('❌ Erreur lors de la mise à jour du médecin :', err);
                    return res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: err });
                }

                if (result.affectedRows === 0) {
                    console.warn('⚠️ Aucune ligne affectée lors de la mise à jour.');
                    return res.status(404).json({ message: 'Médecin non trouvé.' });
                }

                res.status(200).json({ message: 'Médecin mis à jour avec succès.' });
            });
        };

        // Si password est fourni, hacher avant la mise à jour
        if (password && password.trim() !== '') {
            bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
                if (err) {
                    console.error('❌ Erreur lors du hash du mot de passe :', err);
                    return res.status(500).json({ message: 'Erreur lors du traitement du mot de passe.', error: err });
                }
                executeUpdate(hashedPassword);
            });
        } else {
            // Si aucun nouveau mot de passe n'est fourni, conserver l'ancien
            executeUpdate(existingMedecin.password);
        }
    });
};

// DELETE medecin
exports.deleteMedecin = (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM medecins WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Suppression réussie' });
    });
};

// GET search medecins by query (nom ou spécialité)
exports.searchMedecins = (req, res) => {
    const search = `%${req.query.q}%`;
    const sql = `SELECT * FROM medecins WHERE nom LIKE ? OR specialite LIKE ?`;
    db.query(sql, [search, search], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

// PUT update password for medecin
exports.updatePassword = (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log(`🔑 Tentative de mise à jour du mot de passe pour le médecin ID ${id}`);

    // Vérifier que les deux mots de passe sont fournis
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel et le nouveau mot de passe sont requis.' });
    }

    // Récupérer le médecin pour vérifier le mot de passe actuel
    db.query('SELECT * FROM medecins WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération du médecin :', err);
            return res.status(500).json({ message: 'Erreur serveur.', error: err });
        }

        if (results.length === 0) {
            console.warn('⚠️ Médecin non trouvé pour mise à jour du mot de passe.');
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }

        const medecin = results[0];

        // Vérifier que le mot de passe actuel est correct
        bcrypt.compare(currentPassword, medecin.password, (err, isMatch) => {
            if (err) {
                console.error('❌ Erreur lors de la comparaison des mots de passe :', err);
                return res.status(500).json({ message: 'Erreur lors de la vérification du mot de passe.', error: err });
            }

            if (!isMatch) {
                console.warn('⚠️ Mot de passe actuel incorrect.');
                return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
            }

            // Hacher le nouveau mot de passe
            bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
                if (err) {
                    console.error('❌ Erreur lors du hash du nouveau mot de passe :', err);
                    return res.status(500).json({ message: 'Erreur lors du traitement du nouveau mot de passe.', error: err });
                }

                // Mettre à jour le mot de passe dans la base de données
                const sql = 'UPDATE medecins SET password = ? WHERE id = ?';
                db.query(sql, [hashedPassword, id], (err, result) => {
                    if (err) {
                        console.error('❌ Erreur lors de la mise à jour du mot de passe :', err);
                        return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe.', error: err });
                    }

                    if (result.affectedRows === 0) {
                        console.warn('⚠️ Aucune ligne affectée lors de la mise à jour du mot de passe.');
                        return res.status(404).json({ message: 'Médecin non trouvé.' });
                    }

                    console.log('✅ Mot de passe mis à jour avec succès pour le médecin ID :', id);
                    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
                });
            });
        });
    });
};