const express = require('express');
const router  = express.Router();
const { 
  creerRdv, listerRdv, obtenirRdv, 
  changerStatut, creneauxDisponibles 
} = require('../controllers/rdvController');
const { verifierToken } = require('../middleware/authMiddleware');

// GET /api/rdv/disponibles — public
router.get('/disponibles', creneauxDisponibles);

// POST /api/rdv — public (citoyen crée un rdv)
router.post('/', creerRdv);

// GET /api/rdv — protégé (agents seulement)
router.get('/', verifierToken, listerRdv);

// GET /api/rdv/:reference — public (citoyen vérifie son rdv)
router.get('/:reference', obtenirRdv);

// PUT /api/rdv/:id/statut — protégé (agents seulement)
router.put('/:id/statut', verifierToken, changerStatut);

module.exports = router;