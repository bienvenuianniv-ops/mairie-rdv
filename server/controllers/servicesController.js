const pool = require('../config/db');

// ── LISTER TOUS LES SERVICES ──
const listerServices = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── CRÉER UN SERVICE ──
const creerService = async (req, res) => {
  const { nom, description, duree_min } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO services (nom, description, duree_min)
       VALUES ($1, $2, $3) RETURNING *`,
      [nom, description, duree_min || 30]
    );
    res.status(201).json({
      message: '✅ Service créé avec succès !',
      service: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── MODIFIER UN SERVICE ──
const modifierService = async (req, res) => {
  const { id } = req.params;
  const { nom, description, duree_min, actif } = req.body;
  try {
    const result = await pool.query(
      `UPDATE services 
       SET nom=$1, description=$2, duree_min=$3, actif=$4
       WHERE id=$5 RETURNING *`,
      [nom, description, duree_min, actif, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '❌ Service non trouvé !' });
    }
    res.json({
      message: '✅ Service modifié avec succès !',
      service: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── SUPPRIMER UN SERVICE ──
const supprimerService = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM services WHERE id=$1', [id]);
    res.json({ message: '✅ Service supprimé avec succès !' });
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

module.exports = { listerServices, creerService, modifierService, supprimerService };