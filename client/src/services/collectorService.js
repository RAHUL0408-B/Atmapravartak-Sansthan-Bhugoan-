import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

const collectorsCollection = collection(db, 'collectors');

export const getCollectors = async () => {
    try {
        const q = query(
            collectorsCollection,
            where('isDeleted', '==', false),
            orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const collectors = [];
        querySnapshot.forEach((doc) => {
            collectors.push({ id: doc.id, ...doc.data() });
        });
        return collectors;
    } catch (error) {
        console.error('Error getting collectors:', error);
        throw error;
    }
};

export const getCollectorById = async (id) => {
    try {
        const collectorDoc = doc(db, 'collectors', id);
        const docSnap = await getDoc(collectorDoc);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Collector not found');
        }
    } catch (error) {
        console.error('Error getting collector:', error);
        throw error;
    }
};

export const createCollector = async (collectorData) => {
    try {
        const docRef = await addDoc(collectorsCollection, {
            ...collectorData,
            isDeleted: false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        // Get the created document
        const docSnap = await getDoc(docRef);
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error creating collector:', error);
        throw error;
    }
};

export const updateCollector = async (id, collectorData) => {
    try {
        const collectorDoc = doc(db, 'collectors', id);
        await updateDoc(collectorDoc, {
            ...collectorData,
            updated_at: serverTimestamp()
        });

        // Get the updated document
        const docSnap = await getDoc(collectorDoc);
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error updating collector:', error);
        throw error;
    }
};

export const deleteCollector = async (id) => {
    try {
        const collectorDoc = doc(db, 'collectors', id);
        await updateDoc(collectorDoc, {
            isDeleted: true,
            updated_at: serverTimestamp()
        });
    } catch (error) {
        console.error('Error soft deleting collector:', error);
        throw error;
    }
};

export const restoreCollector = async (id) => {
    try {
        const collectorDoc = doc(db, 'collectors', id);
        await updateDoc(collectorDoc, {
            isDeleted: false,
            updated_at: serverTimestamp()
        });
    } catch (error) {
        console.error('Error restoring collector:', error);
        throw error;
    }
};

export const getDeletedCollectors = async () => {
    try {
        const q = query(
            collectorsCollection,
            where('isDeleted', '==', true),
            orderBy('updated_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const collectors = [];
        querySnapshot.forEach((doc) => {
            collectors.push({ id: doc.id, ...doc.data() });
        });
        return collectors;
    } catch (error) {
        console.error('Error getting deleted collectors:', error);
        return [];
    }
};
