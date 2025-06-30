const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadProduit'); // multer
const produitsController = require('../controllers/produitsController');
const authMiddleware = require('../middleware/auth');

// Créer un produit avec images multiples
router.post('/', upload.array('images', 10), produitsController.createProduit);

// Lister tous les produits avec leurs images
router.get('/', produitsController.getAllProduits);

// Mettre à jour un produit avec images multiples
router.put('/:id', upload.array('images', 10), produitsController.updateProduit);

// Supprimer un produit (et ses images)
router.delete('/:id', produitsController.deleteProduit);

// Récupérer un seul produit avec ses images
router.get('/:id', produitsController.getProduitById);

// Mettre à jour le stock d'un produit (réduction lors de l'expédition) - Authentification requise
router.put('/:id/stock', produitsController.updateStock);

router.get('/categorie/:categorie_id', produitsController.getAllProduitsByCategorieId);


module.exports = router;
