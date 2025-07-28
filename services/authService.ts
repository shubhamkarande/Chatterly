import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../store/slices/authSlice';

export class AuthService {
  static async signInWithEmail(email: string, password: string): Promise<User> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please configure Firebase.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await this.createUserProfile(userCredential.user);
  }

  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please configure Firebase.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, { displayName });
    
    return await this.createUserProfile(userCredential.user);
  }

  static async signInWithGoogle(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return await this.createUserProfile(userCredential.user);
  }

  static async signOut(): Promise<void> {
    if (auth.currentUser) {
      await this.updateUserStatus(auth.currentUser.uid, false);
    }
    await signOut(auth);
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Auth state changes will not be tracked.');
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.createUserProfile(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  private static async createUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    if (!db) {
      // Return basic user profile without Firestore
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Anonymous',
        photoURL: firebaseUser.photoURL || undefined,
        isOnline: true,
        lastSeen: new Date(),
      };
    }
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'Anonymous',
      photoURL: firebaseUser.photoURL,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'Anonymous',
      photoURL: firebaseUser.photoURL || undefined,
      isOnline: true,
      lastSeen: new Date(),
    };
  }

  static async updateUserStatus(uid: string, isOnline: boolean): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}