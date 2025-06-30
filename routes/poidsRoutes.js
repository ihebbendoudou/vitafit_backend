const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const poidsController = require('../controllers/poidsController');

// Configuration de multer pour les photos de poids
const uploadsDir = path.join(__dirname, '../uploads/poids');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'poids-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB par fichier
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// POST    /poids       - Ajouter un poids avec photos optionnelles
router.post('/', upload.array('photos', 5), poidsController.addWeight);

// GET     /poids/user/:userId - Récupérer les poids d'un utilisateur
router.get('/user/:userId', poidsController.getWeightsByUser);

// PUT     /poids/:id   - Modifier un poids
router.put('/:id', poidsController.updateWeight);

// DELETE  /poids/:id   - Supprimer un poids
router.delete('/:id', poidsController.deleteWeight);

// POST    /poids/share/:userId - Générer un token de partage pour l'historique
router.post('/share/:userId', poidsController.generateShareToken);

// GET     /poids/shared/:token - Récupérer l'historique partagé via token (route publique)
router.get('/shared/:token', poidsController.getSharedWeightHistory);

// DELETE  /poids/share/:userId - Révoquer un token de partage
router.delete('/share/:userId', poidsController.revokeShareToken);

// GET     /poids/public/:userId - Récupérer l'historique de poids publiquement
router.get('/public/:userId', poidsController.getPublicWeightHistory);

module.exports = router;