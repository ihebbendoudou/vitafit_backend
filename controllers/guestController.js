const db = require('../config/db');

// ➕ Créer un guest
exports.createGuest = async (req, res) => {
  try {
    const { nom, prenom, email, telephone } = req.body;

    const [result] = await db.execute(`
      INSERT INTO guests (nom, prenom, email, telephone)
      VALUES (?, ?, ?, ?)
    `, [nom, prenom, email, telephone]);

    res.status(201).json({ message: "Guest créé", id: result.insertId });
  } catch (error) {
    console.error("Erreur création guest :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔍 Obtenir tous les guests
exports.getAllGuests = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM guests`);
    res.json(rows);
  } catch (error) {
    console.error("Erreur lecture guests :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔍 Obtenir un guest par ID
exports.getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`SELECT * FROM guests WHERE id = ?`, [id]);

    if (rows.length === 0) return res.status(404).json({ message: "Guest non trouvé" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✏️ Modifier un guest
exports.updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone } = req.body;

    await db.execute(`
      UPDATE guests
      SET nom = ?, prenom = ?, email = ?, telephone = ?
      WHERE id = ?
    `, [nom, prenom, email, telephone, id]);

    res.json({ message: "Guest mis à jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ❌ Supprimer un guest
exports.deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(`DELETE FROM guests WHERE id = ?`, [id]);
    res.json({ message: "Guest supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
