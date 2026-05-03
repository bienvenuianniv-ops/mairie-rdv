const express = require('express');
const router  = express.Router();
const { listerServices, creerService, modifierService, supprimerService } = require('../controllers/servicesController');
const { verifierToken, verifierAdmin } = require('../middleware/authMiddleware');

// GET /api/services — public
router.get('/', listerServices);

// POST /api/services — admin seulement
router.post('/', verifierToken, verifierAdmin, creerService);

// PUT /api/services/:id — admin seulement
router.put('/:id', verifierToken, verifierAdmin, modifierService);

// DELETE /api/services/:id — admin seulement
router.delete('/:id', verifierToken, verifierAdmin, supprimerService);

module.exports = router;