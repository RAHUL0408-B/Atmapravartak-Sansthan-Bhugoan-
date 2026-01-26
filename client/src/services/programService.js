import { db, storage } from '../firebaseConfig';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const programsCollection = collection(db, 'programs');

export const getPrograms = async () => {
    try {
        const q = query(programsCollection, orderBy('event_date', 'desc'));
        const querySnapshot = await getDocs(q);
        const programs = [];
        querySnapshot.forEach((doc) => {
            programs.push({ id: doc.id, ...doc.data() });
        });
        return programs;
    } catch (error) {
        console.error('Error getting programs:', error);
        return [];
    }
};

export const getProgramById = async (id) => {
    try {
        const programDoc = doc(db, 'programs', id);
        const docSnap = await getDoc(programDoc);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Program not found');
        }
    } catch (error) {
        console.error('Error getting program:', error);
        throw error;
    }
};

export const createProgram = async (programData) => {
    try {
        console.log('Creating program in Firestore...', programData);

        const docRef = await addDoc(programsCollection, {
            ...programData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        console.log('Program created with ID:', docRef.id);

        // Get the created document
        const docSnap = await getDoc(docRef);
        const result = { id: docSnap.id, ...docSnap.data() };

        console.log('Retrieved created program:', result);
        return result;
    } catch (error) {
        console.error('Error creating program:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Provide more specific error messages
        if (error.code === 'permission-denied') {
            throw new Error('Firestore परवानगी नाकारली. कृपया Firestore Database तयार करा आणि security rules सेट करा.');
        } else if (error.code === 'unavailable') {
            throw new Error('Firestore Database उपलब्ध नाही. कृपया Firebase Console मध्ये Firestore Database तयार करा.');
        }

        throw error;
    }
};

export const updateProgram = async (id, programData) => {
    try {
        const programDoc = doc(db, 'programs', id);
        await updateDoc(programDoc, {
            ...programData,
            updated_at: serverTimestamp()
        });

        // Get the updated document
        const docSnap = await getDoc(programDoc);
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error updating program:', error);
        throw error;
    }
};

export const deleteProgram = async (id) => {
    try {
        const programDoc = doc(db, 'programs', id);
        await deleteDoc(programDoc);
    } catch (error) {
        console.error('Error deleting program:', error);
        throw error;
    }
};

export const uploadProgramImage = async (file) => {
    try {
        // Validate file size (max 15MB)
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (file.size > maxSize) {
            throw new Error('फाईल खूप मोठी आहे. कृपया 15MB पेक्षा लहान फाईल निवडा.');
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            throw new Error('अवैध फाईल प्रकार. कृपया JPG, PNG, GIF किंवा WEBP फाईल निवडा.');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `program-images/${fileName}`);

        // Upload file with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadedAt: new Date().toISOString()
            }
        };

        // Upload with timeout handling (300 seconds for larger files/slow connections)
        const uploadTask = uploadBytes(storageRef, file, metadata);

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 300000); // 300 seconds (5 minutes)
        });

        // Race between upload and timeout
        await Promise.race([uploadTask, timeoutPromise]);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);

        // Provide user-friendly error messages
        if (error.message === 'TIMEOUT') {
            throw new Error('अपलोड खूप वेळ घेत आहे. कृपया लहान फाईल वापरा किंवा पुन्हा प्रयत्न करा.');
        } else if (error.code === 'storage/unauthorized') {
            throw new Error('अपलोड परवानगी नाकारली. Firebase Storage सेटअप तपासा.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('अपलोड रद्द केले.');
        } else if (error.code === 'storage/unknown') {
            throw new Error('अपलोड अयशस्वी. कृपया तुमचे इंटरनेट कनेक्शन तपासा.');
        }

        throw error;
    }
};
