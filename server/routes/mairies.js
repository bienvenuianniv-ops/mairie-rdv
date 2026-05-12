const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifierToken } = require('../middleware/authMiddleware');

// GET /api/mairies/:slug — obtenir une mairie par son slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, nom, slug, pays, email, telephone, logo, couleur, langue_locale
       FROM mairies WHERE slug = $1 AND actif = true`,
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '❌ Mairie non trouvée !' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
});

// GET /api/mairies — lister toutes les mairies
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, slug, pays, logo, couleur, actif, created_at
       FROM mairies ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
});

// POST /api/mairies — créer une nouvelle mairie
router.post('/', async (req, res) => {
  const { nom, slug, pays, email, telephone, logo, couleur, langue_locale } = req.body;
  try {
    // Vérifier si le slug existe déjà
    const existe = await pool.query(
      'SELECT id FROM mairies WHERE slug = $1', [slug]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: '❌ Ce slug est déjà utilisé !' });
    }

    const result = await pool.query(
      `INSERT INTO mairies (nom, slug, pays, email, telephone, logo, couleur, langue_locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nom, slug, pays, email, telephone, logo || '🏛️', couleur || '#1a6b3c', langue_locale]
    );
    res.status(201).json({
      message: '✅ Mairie créée avec succès !',
      mairie: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
});// POST /api/mairies/inscrire — inscrire une nouvelle mairie avec son admin
router.post('/inscrire', async (req, res) => {
  const { nom, slug, pays, telephone, logo, couleur, email, admin } = req.body;

  try {
    // Vérifier si le slug existe déjà
    const existe = await pool.query(
      'SELECT id FROM mairies WHERE slug = $1', [slug]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: '❌ Cet identifiant est déjà utilisé !' });
    }

    // Créer la mairie
    const mairie = await pool.query(
      `INSERT INTO mairies (nom, slug, pays, email, telephone, logo, couleur)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nom, slug, pays, email, telephone, logo || '🏛️', couleur || '#1a6b3c']
    );

    const mairieId = mairie.rows[0].id;

    // Créer l'admin de la mairie
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(admin.mot_de_passe, 10);

    await pool.query(
      `INSERT INTO agents (nom, prenom, email, mot_de_passe, role, mairie_id)
       VALUES ($1, $2, $3, $4, 'admin', $5)`,
      [admin.nom, admin.prenom, admin.email, hash, mairieId]
    );

    res.status(201).json({
      message: '✅ Mairie inscrite avec succès !',
      mairie: mairie.rows[0]
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
});

module.exports = router;