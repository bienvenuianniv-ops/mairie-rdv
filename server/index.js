const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
require('dotenv').config();

// Initialiser la connexion DB et créer les tables
require('./config/db');

const { envoyerRappel } = require('./config/email');
const pool = require('./config/db');

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

// ── TÂCHE PLANIFIÉE : Rappels 24h avant ──
// S'exécute chaque jour à 8h00 du matin
cron.schedule('* * * * *', async () => {
  console.log('⏰ Vérification des rappels RDV...');
  try {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    const dateDemain = demain.toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT r.*, s.nom as service_nom 
       FROM rdv r 
       JOIN services s ON r.service_id = s.id
       WHERE r.date_rdv::date = $1 
       AND r.statut = 'confirme'
       AND r.citoyen_email IS NOT NULL 
       AND r.citoyen_email != ''`,
      [dateDemain]
    );

    console.log(`📋 ${result.rows.length} rappel(s) à envoyer`);

    for (const rdv of result.rows) {
      await envoyerRappel(rdv);
      console.log(`✅ Rappel envoyé à ${rdv.citoyen_email}`);
    }

  } catch (err) {
    console.error('❌ Erreur rappels :', err.message);
  }
});

// ── Démarrage ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});