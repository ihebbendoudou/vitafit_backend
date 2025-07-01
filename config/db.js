// db.js
const mysql = require('mysql2');
const dotenv = require('dotenv');


// Charger les variables d'environnement
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql.railway.internal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'YdMSLTubPLMDdQvUfVbqhrtXCmAHjhmc', // Utilise la variable d'environnement ou une chaîne vide
  database: process.env.DB_NAME || 'railway',
});

db.connect((err) => {
  if (err) throw err;
  console.log('🟢 MySQL Connected...');
});

module.exports = db;
