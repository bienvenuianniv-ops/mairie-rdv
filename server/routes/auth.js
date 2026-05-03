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

module.exports = router;