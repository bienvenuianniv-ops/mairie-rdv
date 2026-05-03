const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

// ── INSCRIPTION AGENT ──
const inscrire = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, role } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const existe = await pool.query(
      'SELECT id FROM agents WHERE email = $1', [email]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: '❌ Cet email est déjà utilisé !' });
    }

    // Chiffrer le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'agent
    const result = await pool.query(
      `INSERT INTO agents (nom, prenom, email, mot_de_passe, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, prenom, email, role`,
      [nom, prenom, email, hash, role || 'agent']
    );

    res.status(201).json({
      message: '✅ Agent créé avec succès !',
      agent: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── CONNEXION AGENT ──
const connecter = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    // Chercher l'agent
    const result = await pool.query(
      'SELECT * FROM agents WHERE email = $1 AND actif = true', [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: '❌ Email ou mot de passe incorrect !' });
    }

    const agent = result.rows[0];

    // Vérifier le mot de passe
    const valide = await bcrypt.compare(mot_de_passe, agent.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: '❌ Email ou mot de passe incorrect !' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: agent.id, email: agent.email, role: agent.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '✅ Connexion réussie !',
      token,
      agent: {
        id:     agent.id,
        nom:    agent.nom,
        prenom: agent.prenom,
        email:  agent.email,
        role:   agent.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

module.exports = { inscrire, connecter };