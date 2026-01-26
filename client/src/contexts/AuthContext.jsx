import { createContext, useState, useEffect } from 'react';
import {
    auth,
    googleProvider,
    db
} from '../firebaseConfig';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Update last login in Firestore
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    await setDoc(userRef, {
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                } catch (error) {
                    console.error('Error updating last login:', error);
                }
                setUser(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Gmail Sign In
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create/update user document in Firestore
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // New user - create profile
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    username: user.displayName || user.email.split('@')[0],
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            }

            return { success: true, user };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { success: false, message: error.message };
        }
    };

    // Email/Password Login
    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            let message = 'लॉगिन अयशस्वी. कृपया तुमचा ईमेल आणि पासवर्ड तपासा.';
            if (error.code === 'auth/user-not-found') {
                message = 'या ईमेलसह कोणतेही खाते आढळले नाही.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'अवैध ईमेल पत्ता.';
            }
            return { success: false, message };
        }
    };

    // Email/Password Signup
    const signup = async (email, password, username) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Update display name
            await updateProfile(user, {
                displayName: username
            });

            // Create user document in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: username,
                photoURL: null,
                username: username,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            return { success: true, user };
        } catch (error) {
            let message = 'नोंदणी अयशस्वी. कृपया पुन्हा प्रयत्न करा.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'हा ईमेल आधीच वापरात आहे.';
            } else if (error.code === 'auth/weak-password') {
                message = 'पासवर्ड कमकुवत आहे. किमान 6 वर्ण असावेत.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'अवैध ईमेल पत्ता.';
            }
            return { success: false, message };
        }
    };

    // Forgot Password
    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'पासवर्ड रीसेट लिंक तुमच्या ईमेलवर पाठवली आहे.' };
        } catch (error) {
            let message = 'पासवर्ड रीसेट अयशस्वी.';
            if (error.code === 'auth/user-not-found') {
                message = 'या ईमेलसह कोणतेही खाते आढळले नाही.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'अवैध ईमेल पत्ता.';
            }
            return { success: false, message };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            signup,
            signInWithGoogle,
            resetPassword,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
