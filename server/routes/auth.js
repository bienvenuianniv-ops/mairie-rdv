const express    = require('express');
const router     = express.Router();
const { inscrire, connecter } = require('../controllers/authController');
const { verifierToken } = require('../middleware/authMiddleware');

// POST /api/auth/inscrire
router.post('/inscrire', inscrire);

// POST /api/auth/connecter
router.post('/connecter', connecter);

// GET /api/auth/profil (route protégée)
router.get('/profil', verifierToken, (req, res) => {
  res.json({ 
    message: '✅ Vous êtes connecté !',
    agent: req.agent 
  });
});
const { listerAgents, creerAgent, toggleActif } = require('../controllers/authController');

// GET /api/auth/agents — liste tous les agents (admin seulement)
router.get('/agents', verifierToken, listerAgents);

// POST /api/auth/agents — créer un nouvel agent (admin seulement)
router.post('/agents', verifierToken, creerAgent);

// PUT /api/auth/agents/:id/toggle — activer/désactiver (admin seulement)
router.put('/agents/:id/toggle', verifierToken, toggleActif);
module.exports = router;