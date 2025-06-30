const express = require('express');
const router = express.Router();
const controller = require('../controllers/recipesController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration multer pour upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/recips');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recette-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes publiques (pas besoin d’auth)
router.get('/', controller.getAll);                  // Liste recettes (afficher=TRUE)
router.get('/filter/search', controller.filter);     // Recherche/filtre
router.get('/:id/images', controller.getRecipeImages); // Images d’une recette (changé ici)
router.get('/:id', controller.getById);               // Détails recette par ID

// Routes protégées (authentification requise)
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.post('/:id/images', authMiddleware, upload.single('image'), controller.uploadImage);

module.exports = router;
