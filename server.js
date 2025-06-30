const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const userRoutes = require('./routes/userRoutes');
const typeabonnementRoutes = require('./routes/type_abonnementRoutes');
const abonnementRouter = require('./routes/abonnementRouter');
const paimentRouter = require('./routes/paimentRouter');
const coachRoutes = require('./routes/coachRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const suiviRoutes = require('./routes/suiviRoutes');
const healthInitialRoutes = require('./routes/healthInitialRoutes');
const authRoutes = require('./routes/loginRoutes');
const usersWithCoachRouter = require('./routes/UserWithCoachRouter'); // Correction du nom
const programmeRoutes = require('./routes/programmeRoutes');
const poidsRoutes = require('./routes/poidsRoutes');
const suiviResultatsRoutes = require('./routes/suiviResultatsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const recipeRoutes = require('./routes/recipesRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const guestRoutes = require('./routes/guestRoutes');
const categorieRoutes = require('./routes/categorieRoutes');
const produitsRoutes = require('./routes/produitRoutes');
const commandeRoutes = require('./routes/commandeRoutes');





// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/poids', express.static(path.join(__dirname, 'uploads/poids')));
app.use('/uploads/recips', express.static(path.join(__dirname, 'uploads/recips')));
app.use('/uploads/produits', express.static(path.join(__dirname, 'uploads/produits')));

// Routes spécifiques d'abord
app.use('/api/programmes', programmeRoutes);
app.use('/api/poids', poidsRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/produits', produitsRoutes);
app.use('/api', categorieRoutes);
app.use('/api', commandeRoutes);


// Routes générales ensuite
app.use('/api', userRoutes);
app.use('/api', healthInitialRoutes);
app.use('/api', typeabonnementRoutes);
app.use('/api', abonnementRouter);
app.use('/api', paimentRouter);
app.use('/api', coachRoutes);
app.use('/api', medecinRoutes);
app.use('/api', suiviRoutes);
app.use('/api', authRoutes);
app.use('/api', usersWithCoachRouter); // Utilisation cohérente
app.use('/api', suiviResultatsRoutes);
app.use('/api', messageRoutes);
app.use('/api', reminderRoutes);



// Route pour l'upload d'images
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Retourner l'URL du fichier uploadé
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = 3000;
const HOST = 'https://vitafit-backend.onrender.com';
app.listen( HOST,() => {
  console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
});
