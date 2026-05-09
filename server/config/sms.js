const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY || '',
  username: process.env.AT_USERNAME || 'sandbox'
});

const sms = at.SMS;

// ── SMS DE CONFIRMATION ──
const envoyerSmsConfirmation = async (rdv) => {
  const message = `✅ DigiMairie - RDV confirmé !
Réf: ${rdv.reference}
Service: ${rdv.service_nom}
Date: ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
Heure: ${rdv.heure_rdv.substr(0,5)}
Présentez cette référence à l'accueil.`;

  await sms.send({
    to: [rdv.citoyen_tel],
    message,
    from: 'DigiMairie'
  });

  console.log(`✅ SMS confirmation envoyé à ${rdv.citoyen_tel}`);
};

// ── SMS DE RAPPEL ──
const envoyerSmsRappel = async (rdv) => {
  const message = `⏰ DigiMairie - Rappel RDV demain !
Réf: ${rdv.reference}
Service: ${rdv.service_nom}
Date: ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
Heure: ${rdv.heure_rdv.substr(0,5)}
N'oubliez pas votre pièce d'identité.`;

  await sms.send({
    to: [rdv.citoyen_tel],
    message,
    from: 'DigiMairie'
  });

  console.log(`✅ SMS rappel envoyé à ${rdv.citoyen_tel}`);
};

// ── SMS D'ANNULATION ──
const envoyerSmsAnnulation = async (rdv) => {
  const message = `❌ DigiMairie - RDV annulé
Réf: ${rdv.reference}
Service: ${rdv.service_nom}
Date: ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
Pour reprendre un RDV: digimairie.netlify.app`;

  await sms.send({
    to: [rdv.citoyen_tel],
    message,
    from: 'DigiMairie'
  });

  console.log(`✅ SMS annulation envoyé à ${rdv.citoyen_tel}`);
};

module.exports = { envoyerSmsConfirmation, envoyerSmsRappel, envoyerSmsAnnulation };