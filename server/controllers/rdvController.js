
const pool = require('../config/db');
const crypto = require('crypto');
const { envoyerConfirmation, envoyerAnnulation } = require('../config/email');
const { envoyerSmsConfirmation, envoyerSmsAnnulation } = require('../config/sms');


// ── CRÉER UN RENDEZ-VOUS ──
const creerRdv = async (req, res) => {
  const {
    service_id, citoyen_nom, citoyen_prenom,
    citoyen_tel, citoyen_email, citoyen_nni,
    date_rdv, heure_rdv, paiement, notes
  } = req.body;

  try {
    // Vérifier si le créneau est déjà pris
    const existe = await pool.query(
      `SELECT id FROM rendez_vous 
       WHERE service_id=$1 AND date_rdv=$2 AND heure_rdv=$3
       AND statut != 'annule'`,
      [service_id, date_rdv, heure_rdv]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ 
        message: '❌ Ce créneau est déjà pris !' 
      });
    }

    // Générer la référence unique
   const reference = 'RDV-' + Math.random().toString(36)
                  .substr(2, 7).toUpperCase();
const token_annulation = crypto.randomBytes(32).toString('hex');
    // Insérer le rendez-vous
    const result = await pool.query(
      `INSERT INTO rendez_vous 
        (reference, service_id, citoyen_nom, citoyen_prenom,
         citoyen_tel, citoyen_email, citoyen_nni,
         date_rdv, heure_rdv, paiement, notes, token_annulation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [reference, service_id, citoyen_nom, citoyen_prenom,
       citoyen_tel, citoyen_email, citoyen_nni,
       date_rdv, heure_rdv, paiement || 'guichet', notes, token_annulation]
    );

    const nouveauRdv = result.rows[0];

// Envoyer email si le citoyen a fourni un email
if (nouveauRdv.citoyen_email) {
  try {
    // Récupérer le nom du service
    const service = await pool.query('SELECT nom FROM services WHERE id=$1', [service_id]);
    nouveauRdv.service_nom = service.rows[0]?.nom || '';
    await envoyerConfirmation(nouveauRdv);
 } catch (emailErr) {
    console.error('❌ Erreur envoi email :', emailErr.message);
  }

  try {
    await envoyerSmsConfirmation(nouveauRdv);
  } catch (smsErr) {
    console.error('❌ Erreur SMS confirmation :', smsErr.message);
  }
}

res.status(201).json({
  message: '✅ Rendez-vous créé avec succès !',
  rdv: nouveauRdv
});

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── LISTER TOUS LES RENDEZ-VOUS ──
const listerRdv = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.nom as service_nom
       FROM rendez_vous r
       LEFT JOIN services s ON r.service_id = s.id
       ORDER BY r.date_rdv ASC, r.heure_rdv ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── OBTENIR UN RENDEZ-VOUS PAR RÉFÉRENCE ──
const obtenirRdv = async (req, res) => {
  const { reference } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, s.nom as service_nom
       FROM rendez_vous r
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.reference = $1`,
      [reference]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '❌ Rendez-vous non trouvé !' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── CHANGER LE STATUT D'UN RENDEZ-VOUS ──
const changerStatut = async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const statutsValides = ['en-attente', 'confirme', 'annule', 'termine'];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ message: '❌ Statut invalide !' });
  }

  try {
    const result = await pool.query(
      `UPDATE rendez_vous SET statut=$1 WHERE id=$2 RETURNING *`,
      [statut, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '❌ Rendez-vous non trouvé !' });
    }
    const rdvMaj = result.rows[0];

// Envoyer email d'annulation si statut = annule
if (statut === 'annule' && rdvMaj.citoyen_email) {
  try {
    const service = await pool.query('SELECT nom FROM services WHERE id=$1', [rdvMaj.service_id]);
    rdvMaj.service_nom = service.rows[0]?.nom || '';
    await envoyerAnnulation(rdvMaj);
    await envoyerSmsAnnulation(rdvMaj);
  } catch (emailErr) {
    console.error('❌ Erreur envoi email annulation :', emailErr.message);
  }
}

res.json({
  message: '✅ Statut mis à jour avec succès !',
  rdv: rdvMaj
});
  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};

// ── VÉRIFIER LES CRÉNEAUX DISPONIBLES ──
const creneauxDisponibles = async (req, res) => {
  const { service_id, date } = req.query;

  const tousLesCreneaux = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
    '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  try {
    const pris = await pool.query(
      `SELECT heure_rdv FROM rendez_vous
       WHERE service_id=$1 AND date_rdv=$2 AND statut != 'annule'`,
      [service_id, date]
    );

    const heuresPrises = pris.rows.map(r => 
      r.heure_rdv.substr(0, 5)
    );

    const disponibles = tousLesCreneaux.map(h => ({
      heure: h,
      disponible: !heuresPrises.includes(h)
    }));

    res.json(disponibles);

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};
// ── MODIFIER UN RENDEZ-VOUS ──
const modifierRdv = async (req, res) => {
  const { reference } = req.params;
  const { date_rdv, heure_rdv } = req.body;

  try {
    // Vérifier si le RDV existe
    const rdv = await pool.query(
      'SELECT * FROM rendez_vous WHERE reference = $1', [reference]
    );
    if (rdv.rows.length === 0) {
      return res.status(404).json({ message: '❌ Rendez-vous non trouvé !' });
    }

    // Vérifier que le RDV n'est pas annulé ou terminé
    if (['annule', 'termine'].includes(rdv.rows[0].statut)) {
      return res.status(400).json({ 
        message: '❌ Ce rendez-vous ne peut plus être modifié !' 
      });
    }

    // Vérifier si le nouveau créneau est disponible
    const existe = await pool.query(
      `SELECT id FROM rendez_vous 
       WHERE service_id=$1 AND date_rdv=$2 AND heure_rdv=$3
       AND statut != 'annule' AND reference != $4`,
      [rdv.rows[0].service_id, date_rdv, heure_rdv, reference]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ 
        message: '❌ Ce créneau est déjà pris !' 
      });
    }

    // Modifier le RDV
    const result = await pool.query(
      `UPDATE rendez_vous 
       SET date_rdv=$1, heure_rdv=$2, statut='en-attente'
       WHERE reference=$3 RETURNING *`,
      [date_rdv, heure_rdv, reference]
    );

    res.json({
      message: '✅ Rendez-vous modifié avec succès !',
      rdv: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Erreur serveur', erreur: err.message });
  }
};
// ── ANNULATION PAR LE CITOYEN (via lien email) ──
const annulerCitoyen = async (req, res) => {
  const { reference } = req.params;
  const { token } = req.query;

  try {
    const rdv = await pool.query(
      `SELECT r.*, s.nom as service_nom
       FROM rendez_vous r
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.reference = $1`,
      [reference]
    );

    if (rdv.rows.length === 0) {
      return res.send(`
        <div style="font-family:Arial,sans-serif;text-align:center;padding:3rem">
          <h2 style="color:#c0392b">❌ Rendez-vous introuvable</h2>
          <p>La référence <strong>${reference}</strong> n'existe pas.</p>
        </div>
      `);
    }

    const r = rdv.rows[0];

    // ── Vérifier le token ──
    if (!token || token !== r.token_annulation) {
      return res.status(403).send(`
        <div style="font-family:Arial,sans-serif;text-align:center;padding:3rem">
          <h2 style="color:#c0392b">🔒 Accès refusé</h2>
          <p>Lien d'annulation invalide ou expiré.</p>
        </div>
      `);
    }

    if (r.statut === 'annule') {
      return res.send(`
        <div style="font-family:Arial,sans-serif;text-align:center;padding:3rem">
          <h2 style="color:#e8a020">⚠️ Déjà annulé</h2>
          <p>Ce rendez-vous <strong>${reference}</strong> est déjà annulé.</p>
        </div>
      `);
    }

    // Annuler le RDV
    await pool.query(
      `UPDATE rendez_vous SET statut='annule' WHERE reference=$1`,
      [reference]
    );

    // Envoyer email de confirmation d'annulation
    if (r.citoyen_email) {
      try {
        await envoyerAnnulation(r);
      } catch (emailErr) {
        console.error('❌ Erreur email annulation :', emailErr.message);
      }
    }

    res.send(`
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:3rem auto;text-align:center;padding:2rem;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)">
        <div style="font-size:4rem">✅</div>
        <h2 style="color:#1a6b3c;margin:1rem 0">Rendez-vous annulé</h2>
        <p>Votre rendez-vous <strong style="color:#1a6b3c">${reference}</strong> a été annulé avec succès.</p>
        <p style="color:#6b7280;font-size:.85rem;margin-top:1rem">
          Service : ${r.service_nom}<br>
          Date : ${new Date(r.date_rdv).toLocaleDateString('fr-FR')}<br>
          Heure : ${r.heure_rdv.substr(0,5)}
        </p>
        <a href="https://mairie-rdv-frontend.onrender.com" 
           style="display:inline-block;margin-top:1.5rem;background:#1a6b3c;color:white;padding:.7rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:700">
          🏛️ Reprendre un rendez-vous
        </a>
      </div>
    `);

  } catch (err) {
    res.status(500).send(`<p>❌ Erreur serveur : ${err.message}</p>`);
  }
};
module.exports = { 
  creerRdv, listerRdv, obtenirRdv, 
  changerStatut, creneauxDisponibles, modifierRdv, annulerCitoyen
};