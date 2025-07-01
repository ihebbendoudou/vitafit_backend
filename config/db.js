// db.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,       // pas de valeur par défaut, oblige à configurer
    port: process.env.DB_PORT,          // Ajout du port ici
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL:', err);
    throw err;
  }
  console.log('🟢 MySQL Connected...');
});

module.exports = db;
