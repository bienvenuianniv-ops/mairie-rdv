const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── EMAIL DE CONFIRMATION ──
const envoyerConfirmation = async (rdv) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: rdv.citoyen_email,
    subject: `✅ Confirmation RDV — ${rdv.reference}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a6b3c;padding:2rem;text-align:center">
          <h1 style="color:white;margin:0">🏛️ MairieConnect</h1>
          <p style="color:#e8f5ee;margin:.5rem 0 0">Services numériques aux citoyens</p>
        </div>
        <div style="padding:2rem;background:#f7f9f7">
          <h2 style="color:#1a6b3c">✅ Votre rendez-vous est confirmé !</h2>
          <div style="background:white;border-radius:12px;padding:1.5rem;margin:1rem 0">
            <p><strong>Référence :</strong> <span style="color:#1a6b3c;font-size:1.1rem">${rdv.reference}</span></p>
            <p><strong>Service :</strong> ${rdv.service_nom}</p>
            <p><strong>Date :</strong> ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${rdv.heure_rdv.substr(0,5)}</p>
            <p><strong>Nom :</strong> ${rdv.citoyen_prenom} ${rdv.citoyen_nom}</p>
            <p><strong>Paiement :</strong> ${rdv.paiement === 'guichet' ? '💵 Au guichet' : '📱 Mobile Money'}</p>
          </div>
          <div style="background:#fef3d0;border:2px solid #e0a020;border-radius:8px;padding:1rem;margin-top:1rem">
            <p style="margin:0;color:#7a5500">⚠️ <strong>Important :</strong> Présentez cette référence à l'accueil de la mairie le jour de votre rendez-vous.</p>
          </div>
        </div>
        <div style="background:#1a6b3c;padding:1rem;text-align:center">
          <p style="color:#e8f5ee;font-size:.85rem;margin:0">MairieConnect — Services numériques aux citoyens</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email envoyé à ${rdv.citoyen_email}`);
};

// ── EMAIL D'ANNULATION ──
const envoyerAnnulation = async (rdv) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: rdv.citoyen_email,
    subject: `❌ Annulation RDV — ${rdv.reference}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a6b3c;padding:2rem;text-align:center">
          <h1 style="color:white;margin:0">🏛️ MairieConnect</h1>
        </div>
        <div style="padding:2rem;background:#f7f9f7">
          <h2 style="color:#c0392b">❌ Votre rendez-vous a été annulé</h2>
          <div style="background:white;border-radius:12px;padding:1.5rem;margin:1rem 0">
            <p><strong>Référence :</strong> ${rdv.reference}</p>
            <p><strong>Service :</strong> ${rdv.service_nom}</p>
            <p><strong>Date :</strong> ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure :</strong> ${rdv.heure_rdv.substr(0,5)}</p>
          </div>
          <p>Pour reprendre un rendez-vous, visitez notre site.</p>
        </div>
        <div style="background:#1a6b3c;padding:1rem;text-align:center">
          <p style="color:#e8f5ee;font-size:.85rem;margin:0">MairieConnect — Services numériques aux citoyens</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email annulation envoyé à ${rdv.citoyen_email}`);
};
module.exports = { envoyerConfirmation, envoyerAnnulation };