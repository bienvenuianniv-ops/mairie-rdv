const express = require('express');
const router  = express.Router();
const { 
  creerRdv, listerRdv, obtenirRdv, 
  changerStatut, creneauxDisponibles, modifierRdv 
} = require('../controllers/rdvController');
const { verifierToken } = require('../middleware/authMiddleware');

// GET /api/rdv/disponibles — public
router.get('/disponibles', creneauxDisponibles);

// POST /api/rdv — public (citoyen crée un rdv)
router.post('/', creerRdv);

// GET /api/rdv — protégé (agents seulement)
router.get('/', verifierToken, listerRdv);

// PUT /api/rdv/:reference/modifier — public (citoyen modifie son rdv)
router.put('/:reference/modifier', modifierRdv);

// PUT /api/rdv/:id/statut — protégé (agents seulement)
router.put('/:id/statut', verifierToken, changerStatut);

// GET /api/rdv/:reference — public (citoyen vérifie son rdv)
router.get('/:reference', obtenirRdv);
// GET /api/rdv/:reference/annuler-citoyen — public (citoyen annule son rdv)
router.get('/:reference/annuler-citoyen', require('../controllers/rdvController').annulerCitoyen);
module.exports = router;