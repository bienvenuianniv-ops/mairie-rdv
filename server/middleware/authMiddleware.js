const jwt = require('jsonwebtoken');

const verifierToken = (req, res, next) => {
  try {
    // Récupérer le token dans le header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        message: '❌ Accès refusé ! Token manquant.' 
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.agent = decoded; // On attache les infos de l'agent à la requête
    next(); // On laisse passer

  } catch (err) {
    return res.status(403).json({ 
      message: '❌ Token invalide ou expiré !' 
    });
  }
};

// Vérifier si l'agent est admin
const verifierAdmin = (req, res, next) => {
  if (req.agent.role !== 'admin') {
    return res.status(403).json({ 
      message: '❌ Accès réservé aux administrateurs !' 
    });
  }
  next();
};

module.exports = { verifierToken, verifierAdmin };