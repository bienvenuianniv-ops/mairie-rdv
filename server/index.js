const express = require('express');
const cors    = require('cors');
require('dotenv').config();

// Initialiser la connexion DB et créer les tables
require('./config/db');

const app = express();

// ── Middlewares ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/rdv',      require('./routes/rdv'));
app.use('/api/services', require('./routes/services'));

// ── Route de test ──
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Serveur Mairie-RDV opérationnel !',
    version: '1.0.0'
  });
});

// ── Démarrage ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});