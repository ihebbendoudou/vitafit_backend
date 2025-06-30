// Middleware d'authentification de base
exports.authenticate = (req, res, next) => {
    // Dans une application réelle, vous auriez une vérification JWT ou session ici
    // Pour l'exemple, nous supposons que l'utilisateur est dans req.user
    if (!req.user) {
        return res.status(401).json({ message: 'Non authentifié' });
    }
    next();
};

// Middleware pour les coaches seulement
exports.coachOnly = (req, res, next) => {
    // Vérifier si l'utilisateur est un coach
    if (req.user.role !== 'coach') {
        return res.status(403).json({ message: 'Accès réservé aux coaches' });
    }
    next();
};

// Middleware pour les utilisateurs seulement
exports.userOnly = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Accès réservé aux utilisateurs' });
    }
    next();
}; 

