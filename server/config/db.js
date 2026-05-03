require('dotenv').config();
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Tester la connexion au démarrage
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur connexion PostgreSQL :', err.message);
  } else {
    console.log('✅ PostgreSQL Neon connecté avec succès !');
    release();
  }
});

// Créer les tables automatiquement
const createTables = async () => {
  try {
    await pool.query(`

      -- Table des services
      CREATE TABLE IF NOT EXISTS services (
        id          SERIAL PRIMARY KEY,
        nom         VARCHAR(100) NOT NULL,
        description TEXT,
        duree_min   INTEGER DEFAULT 30,
        actif       BOOLEAN DEFAULT true,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      -- Table des agents
      CREATE TABLE IF NOT EXISTS agents (
        id            SERIAL PRIMARY KEY,
        nom           VARCHAR(100) NOT NULL,
        prenom        VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        mot_de_passe  VARCHAR(255) NOT NULL,
        role          VARCHAR(20) DEFAULT 'agent',
        actif         BOOLEAN DEFAULT true,
        created_at    TIMESTAMP DEFAULT NOW()
      );

      -- Table des rendez-vous
      CREATE TABLE IF NOT EXISTS rendez_vous (
        id             SERIAL PRIMARY KEY,
        reference      VARCHAR(20) UNIQUE NOT NULL,
        service_id     INTEGER REFERENCES services(id),
        citoyen_nom    VARCHAR(150) NOT NULL,
        citoyen_prenom VARCHAR(150) NOT NULL,
        citoyen_tel    VARCHAR(20) NOT NULL,
        citoyen_email  VARCHAR(150),
        citoyen_nni    VARCHAR(50),
        date_rdv       DATE NOT NULL,
        heure_rdv      TIME NOT NULL,
        statut         VARCHAR(20) DEFAULT 'en-attente',
        paiement       VARCHAR(20) DEFAULT 'guichet',
        notes          TEXT,
        agent_id       INTEGER REFERENCES agents(id),
        created_at     TIMESTAMP DEFAULT NOW()
      );

      -- Table des disponibilités
      CREATE TABLE IF NOT EXISTS disponibilites (
        id          SERIAL PRIMARY KEY,
        service_id  INTEGER REFERENCES services(id),
        date        DATE NOT NULL,
        heure       TIME NOT NULL,
        disponible  BOOLEAN DEFAULT true
      );

    `);
    console.log('✅ Tables créées avec succès !');
  } catch (err) {
    console.error('❌ Erreur création tables :', err.message);
  }
};

createTables();

module.exports = pool;