import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    limit
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    FirebaseStorage
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Firebase config from app.config.ts
const firebaseConfig = Constants.expoConfig?.extra?.firebase || {
    apiKey: 'AIzaSyB0tOHpD1TZZx9VUEnzZH2Gp23jR4OVH0k',
    authDomain: 'chatterly-327d6.firebaseapp.com',
    projectId: 'chatterly-327d6',
    storageBucket: 'chatterly-327d6.firebasestorage.app',
    messagingSenderId: '933413732224',
    appId: '1:933413732224:web:00e20dc10a51ec8dff8b65',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };

// Auth helpers
export const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        photoURL: null,
        online: true,
        createdAt: serverTimestamp(),
    });

    return user;
};

export const signOut = async () => {
    // Update online status before signing out
    const user = auth.currentUser;
    if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
            online: false,
            lastSeen: serverTimestamp(),
        });
    }
    await firebaseSignOut(auth);
};

export const getCurrentUser = () => auth.currentUser;

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Firestore helpers
export const getUserById = async (uid: string) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: Partial<{ name: string; photoURL: string; pushToken: string }>) => {
    await updateDoc(doc(db, 'users', uid), data);
};

export const setUserOnline = async (uid: string, online: boolean) => {
    const updateData: any = { online };
    if (!online) {
        updateData.lastSeen = serverTimestamp();
    }
    await updateDoc(doc(db, 'users', uid), updateData);
};

// Export Firestore functions for use elsewhere
export {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    limit,
    ref,
    uploadBytes,
    getDownloadURL,
};
