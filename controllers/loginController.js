const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const login = (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // 1. Recherche dans la table user
    pool.query('SELECT * FROM user WHERE email = ?', [email], async (error, users) => {
        if (error) {
            console.error('Erreur de requête user:', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (users.length > 0) {
            const user = users[0];
            
            // Comparaison du mot de passe haché
            try {
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    return generateToken(res, user.id, user.email, user.role);
                }
            } catch (bcryptError) {
                console.error('Erreur de comparaison bcrypt:', bcryptError);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
        }

        // 2. Si pas trouvé dans user, on cherche dans coach
        pool.query('SELECT * FROM coach WHERE email = ?', [email], async (error, coaches) => {
            if (error) {
                console.error('Erreur de requête coach:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

            if (coaches.length > 0) {
                const coach = coaches[0];
                
                try {
                    const match = await bcrypt.compare(password, coach.mot_de_passe);
                    if (match) {
                        return generateToken(res, coach.id, coach.email, 'coach');
                    }
                } catch (bcryptError) {
                    console.error('Erreur de comparaison bcrypt:', bcryptError);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
            }

            // 3. Si pas trouvé dans coach, on cherche dans medecins
            pool.query('SELECT * FROM medecins WHERE email = ?', [email], async (error, medecins) => {
                if (error) {
                    console.error('Erreur de requête medecins:', error);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                if (medecins.length > 0) {
                    const medecin = medecins[0];
                    
                    try {
                        const match = await bcrypt.compare(password, medecin.password);
                        if (match) {
                            return generateToken(res, medecin.id, medecin.email, 'medecin');
                        }
                    } catch (bcryptError) {
                        console.error('Erreur de comparaison bcrypt:', bcryptError);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                }

                // Si aucune correspondance
                res.status(401).json({ message: 'Identifiants invalides' });
            });
        });
    });
};

// ... generateToken reste inchangé ...
// Fonction pour générer le JWT (inchangée)
const generateToken = (res, userId, email, role) => {
    const payload = {
        userId,
        email,
        role,
        iss: 'vitafit-api',
        aud: 'vitafit-client'
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({
        token,
        userId,
        email,
        role,
        message: 'Connexion réussie'
    });
};

module.exports = { login };