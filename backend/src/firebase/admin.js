const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    if (admin.apps.length === 0) {
        // Check if running with service account or emulator
        if (process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        } else {
            // For development without service account
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'chatterly-327d6',
            });
        }
    }
    return admin;
};

const firebaseAdmin = initializeFirebase();
const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();

module.exports = { firebaseAdmin, db, auth };
