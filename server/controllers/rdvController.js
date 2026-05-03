const pool = require('../config/db');

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

    // Insérer le rendez-vous
    const result = await pool.query(
      `INSERT INTO rendez_vous 
        (reference, service_id, citoyen_nom, citoyen_prenom,
         citoyen_tel, citoyen_email, citoyen_nni,
         date_rdv, heure_rdv, paiement, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [reference, service_id, citoyen_nom, citoyen_prenom,
       citoyen_tel, citoyen_email, citoyen_nni,
       date_rdv, heure_rdv, paiement || 'guichet', notes]
    );

    res.status(201).json({
      message: '✅ Rendez-vous créé avec succès !',
      rdv: result.rows[0]
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
    res.json({
      message: '✅ Statut mis à jour avec succès !',
      rdv: result.rows[0]
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
module.exports = { 
  creerRdv, listerRdv, obtenirRdv, 
  changerStatut, creneauxDisponibles, modifierRdv 
};