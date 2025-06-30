const db = require('../config/db');

// Get all recipes affichées (afficher = TRUE)
exports.getAll = function (req, res) {
  try {
    const sql = `
    SELECT 
      r.*, 
      (SELECT image_url 
       FROM image_recipes 
       WHERE recipe_id = r.id 
       ORDER BY id ASC 
       LIMIT 1) AS main_image 
    FROM recipes r 
    WHERE r.afficher = TRUE
  `;
  db.query(sql, function (err, results) {
          if (err) return res.status(500).json({ message: 'Erreur serveur' });
      res.json(results);
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Get recipe by ID (sans filtrer afficher, on peut voir toutes)
exports.getById = function (req, res) {
  try {
    const id = req.params.id;
    db.query('SELECT * FROM recipes WHERE id = ?', [id], function (err, results) {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (results.length === 0) return res.status(404).json({ message: 'Non trouvé' });
      res.json(results[0]);
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Create recipe (avec gestion de afficher optionnel)
exports.create = function (req, res) {
  try {
    console.log('📝 Données reçues pour création:', req.body);
    
    const { 
      title, description, ingredients, steps, calories, image_url, afficher,
      prep_time, cook_time, total_time, servings, difficulty, category, cuisine
    } = req.body;
    
    // Validation des champs obligatoires
    if (!title || !description) {
      console.log('❌ Champs obligatoires manquants');
      return res.status(400).json({ message: 'Titre et description sont obligatoires' });
    }
    
    const afficherValue = (typeof afficher === 'boolean') ? afficher : true; // true par défaut
    
    console.log('📊 Valeurs à insérer:', {
      title, description, ingredients, steps, calories, image_url, afficherValue,
      prep_time: prep_time || null, 
      cook_time: cook_time || null, 
      total_time: total_time || null, 
      servings: servings || null, 
      difficulty: difficulty || 'Medium', 
      category: category || null, 
      cuisine: cuisine || null
    });

    db.query(
      `INSERT INTO recipes (
        title, description, ingredients, steps, calories, afficher,
        prep_time, cook_time, total_time, servings, difficulty, category, cuisine
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, ingredients, steps, calories, afficherValue,
        prep_time || null, cook_time || null, total_time || null, 
        servings || null, difficulty || 'Medium', category || null, cuisine || null
      ],
      function (err, result) {
        if (err) {
          console.error('❌ Erreur SQL lors de l\'insertion:', err);
          return res.status(500).json({ message: 'Insertion échouée', error: err.message });
        }
        console.log('✅ Recette créée avec succès, ID:', result.insertId);
        res.status(201).json({ id: result.insertId, message: 'Recette ajoutée' });
      }
    );
  } catch (e) {
    console.error('❌ Erreur dans exports.create:', e);
    res.status(500).json({ message: 'Erreur interne', error: e.message });
  }
};

// Update recipe (avec mise à jour de afficher)
exports.update = function (req, res) {
  try {
    const id = req.params.id;
    const { 
      title, description, ingredients, steps, calories, afficher,
      prep_time, cook_time, total_time, servings, difficulty, category, cuisine
    } = req.body;
    const afficherValue = (typeof afficher === 'boolean') ? afficher : true; // true par défaut

    db.query(
      `UPDATE recipes SET 
        title = ?, description = ?, ingredients = ?, steps = ?, calories = ?, afficher = ?,
        prep_time = ?, cook_time = ?, total_time = ?, servings = ?, difficulty = ?, category = ?, cuisine = ?
      WHERE id = ?`,
      [
        title, description, ingredients, steps, calories, afficherValue,
        prep_time || null, cook_time || null, total_time || null, 
        servings || null, difficulty || 'Medium', category || null, cuisine || null, id
      ],
      function (err) {
        if (err) return res.status(500).json({ message: 'Mise à jour échouée' });
        res.json({ message: 'Recette mise à jour' });
      }
    );
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Delete recipe
exports.delete = function (req, res) {
  try {
    const id = req.params.id;
    db.query('DELETE FROM recipes WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ message: 'Suppression échouée' });
      res.json({ message: 'Recette supprimée' });
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Upload image
exports.uploadImage = function (req, res) {
  try {
    const recipeId = req.params.id;
    const image = req.file ? req.file.filename : null;

    if (!image) return res.status(400).json({ message: 'Aucune image reçue' });

    db.query(
      'INSERT INTO image_recipes (recipe_id, image_url) VALUES (?, ?)',
      [recipeId, image],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erreur image DB' });
        res.json({ message: 'Image uploadée', image });
      }
    );
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Get images for a recipe
exports.getRecipeImages = function (req, res) {
  try {
    const recipeId = req.params.id;
    db.query(
      'SELECT * FROM image_recipes WHERE recipe_id = ? ORDER BY id ASC',
      [recipeId],
      function (err, results) {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        res.json(results);
      }
    );
  } catch (e) {
    res.status(500).json({ message: 'Erreur interne' });
  }
};

// Filter recipes with afficher = TRUE
exports.filter = function (req, res) {
  try {
    const { maxCalories, ingredient, difficulty, category, cuisine, maxPrepTime, maxCookTime } = req.query;
    let sql = 'SELECT * FROM recipes WHERE afficher = TRUE';
    const params = [];

    if (maxCalories) {
      sql += ' AND calories <= ?';
      params.push(maxCalories);
    }

    if (ingredient) {
      sql += ' AND ingredients LIKE ?';
      params.push(`%${ingredient}%`);
    }

    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (category) {
      sql += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }

    if (cuisine) {
      sql += ' AND cuisine LIKE ?';
      params.push(`%${cuisine}%`);
    }

    if (maxPrepTime) {
      sql += ' AND prep_time <= ?';
      params.push(maxPrepTime);
    }

    if (maxCookTime) {
      sql += ' AND cook_time <= ?';
      params.push(maxCookTime);
    }

    db.query(sql, params, function (err, results) {
      if (err) return res.status(500).json({ message: 'Erreur filtre' });
      res.json(results);
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur filtre interne' });
  }
};
