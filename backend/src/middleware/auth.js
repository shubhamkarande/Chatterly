const { auth } = require('../firebase/admin');

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email,
        };
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

/**
 * Verify socket authentication
 */
const verifySocketToken = async (token) => {
    try {
        const decodedToken = await auth.verifyIdToken(token);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email,
        };
    } catch (error) {
        console.error('Socket token verification failed:', error.message);
        return null;
    }
};

module.exports = { verifyToken, verifySocketToken };
