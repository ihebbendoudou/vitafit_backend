const db = require('../config/db');

// Envoyer un message
const sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const sender_id = req.user.id; // Récupéré du middleware d'authentification
        const sender_type = req.user.role; // Type de l'expéditeur

        if (!receiver_id || !content) {
            return res.status(400).json({ error: 'receiver_id et content sont requis' });
        }

        // Récupérer le type du destinataire
        const receiverQuery = 'SELECT role FROM user WHERE id = ?';
        const [receiverResult] = await db.execute(receiverQuery, [receiver_id]);
        
        if (receiverResult.length === 0) {
            return res.status(404).json({ error: 'Destinataire non trouvé' });
        }
        
        const receiver_type = receiverResult[0].role;

        // Insérer le message avec les types
        const query = 'INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [sender_id, sender_type, receiver_id, receiver_type, content]);

        // Mettre à jour ou créer la conversation
        await updateConversation(sender_id, sender_type, receiver_id, receiver_type, content);

        res.status(201).json({
            message: 'Message envoyé avec succès',
            messageId: result.insertId
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer les messages d'une conversation
const getMessages = async (req, res) => {
    try {
        const { user_id } = req.params;
        const current_user_id = req.user.id;

        const query = `
            SELECT m.*, 
                   u1.nom as sender_nom, u1.prenom as sender_prenom, u1.role as sender_role,
                   u2.nom as receiver_nom, u2.prenom as receiver_prenom, u2.role as receiver_role
            FROM messages m
            JOIN user u1 ON m.sender_id = u1.id
            JOIN user u2 ON m.receiver_id = u2.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.timestamp ASC
        `;

        const [messages] = await db.execute(query, [current_user_id, user_id, user_id, current_user_id]);

        // Marquer les messages comme lus
        const updateQuery = 'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ?';
        await db.execute(updateQuery, [current_user_id, user_id]);

        res.status(200).json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer toutes les conversations d'un utilisateur
const getConversations = async (req, res) => {
    try {
        const user_id = req.user.id;
        const user_type = req.user.role;

        const query = `
            SELECT DISTINCT
                CASE 
                    WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_id
                    ELSE c.user1_id
                END as other_user_id,
                CASE 
                    WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type
                    ELSE c.user1_type
                END as other_user_type,
                c.last_message,
                c.last_updated,
                (
                    SELECT COUNT(*) 
                    FROM messages m 
                    WHERE m.receiver_id = ? 
                      AND m.sender_id = CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_id ELSE c.user1_id END
                      AND m.is_read = FALSE
                ) as unread_count
            FROM conversations c
            WHERE (c.user1_id = ? AND c.user1_type = ?) OR (c.user2_id = ? AND c.user2_type = ?)
            ORDER BY c.last_updated DESC
        `;

        const [conversations] = await db.execute(query, [
            user_id, user_type, user_id, user_type, 
            user_id, user_id, user_type, 
            user_id, user_type, user_id, user_type
        ]);

        // Enrichir les conversations avec les informations des utilisateurs
        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            let otherUserInfo = {};
            
            if (conv.other_user_type === 'user') {
                const [userInfo] = await db.execute(
                    'SELECT nom, prenom, role FROM user WHERE id = ?', 
                    [conv.other_user_id]
                );
                if (userInfo.length > 0) {
                    otherUserInfo = userInfo[0];
                }
            } else if (conv.other_user_type === 'medecin') {
                const [medecinInfo] = await db.execute(
                    'SELECT nom, nom as prenom, \'medecin\' as role FROM medecins WHERE id = ?', 
                    [conv.other_user_id]
                );
                if (medecinInfo.length > 0) {
                    otherUserInfo = medecinInfo[0];
                }
            } else if (conv.other_user_type === 'coach') {
                const [coachInfo] = await db.execute(
                    'SELECT nom, prenom, \'coach\' as role FROM coach WHERE id = ?', 
                    [conv.other_user_id]
                );
                if (coachInfo.length > 0) {
                    otherUserInfo = coachInfo[0];
                }
            }
            
            return {
                ...conv,
                other_user_nom: otherUserInfo.nom || 'Utilisateur inconnu',
                other_user_prenom: otherUserInfo.prenom || '',
                other_user_role: otherUserInfo.role || conv.other_user_type
            };
        }));

        res.status(200).json(enrichedConversations);
    } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer les utilisateurs disponibles pour démarrer une conversation
const getAvailableUsers = async (req, res) => {
    try {
        const current_user_id = req.user.id;
        const current_user_role = req.user.role;
        let users = [];

        // Médecin : liste des patients uniquement
        if (current_user_role === 'medecin') {
            const [patients] = await db.promise().query(`
                SELECT id, nom, prenom, 'user' as role, email
                FROM user 
                WHERE role = 'user'
                ORDER BY nom, prenom
            `);
            users = patients;
        }
        // Patient : liste des médecins uniquement
        else if (current_user_role === 'user') {
            const [medecins] = await db.promise().query(`
                SELECT id, nom, nom as prenom, 'medecin' as role, email, specialite
                FROM medecins 
                ORDER BY nom
            `);
            users = medecins;
        }
        // Autres rôles : admin et coach => tous les utilisateurs
        else {
            const [allUsers] = await db.promise().query(`
                SELECT id, nom, prenom, role, email 
                FROM user
                UNION ALL
                SELECT id, nom, nom as prenom, 'medecin' as role, email 
                FROM medecins
                UNION ALL
                SELECT id, nom, prenom, 'coach' as role, email 
                FROM coach
                ORDER BY role, nom
            `);
            users = allUsers;
        }

        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs disponibles:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Fonction utilitaire pour mettre à jour la conversation
const updateConversation = async (user1_id, user1_type, user2_id, user2_type, last_message) => {
    try {
        // Vérifier si la conversation existe déjà
        const checkQuery = `
            SELECT id FROM conversations 
            WHERE (user1_id = ? AND user1_type = ? AND user2_id = ? AND user2_type = ?) 
               OR (user1_id = ? AND user1_type = ? AND user2_id = ? AND user2_type = ?)
        `;
        const [existing] = await db.execute(checkQuery, [
            user1_id, user1_type, user2_id, user2_type,
            user2_id, user2_type, user1_id, user1_type
        ]);

        if (existing.length > 0) {
            // Mettre à jour la conversation existante
            const updateQuery = 'UPDATE conversations SET last_message = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?';
            await db.execute(updateQuery, [last_message, existing[0].id]);
        } else {
            // Créer une nouvelle conversation
            const insertQuery = 'INSERT INTO conversations (user1_id, user1_type, user2_id, user2_type, last_message) VALUES (?, ?, ?, ?, ?)';
            await db.execute(insertQuery, [user1_id, user1_type, user2_id, user2_type, last_message]);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la conversation:', error);
    }
};

// Marquer les messages comme lus
const markAsRead = async (req, res) => {
    try {
        const { sender_id } = req.params;
        const receiver_id = req.user.id;

        const query = 'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?';
        await db.execute(query, [sender_id, receiver_id]);

        res.status(200).json({ message: 'Messages marqués comme lus' });
    } catch (error) {
        console.error('Erreur lors du marquage des messages:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    getAvailableUsers,
    markAsRead
};