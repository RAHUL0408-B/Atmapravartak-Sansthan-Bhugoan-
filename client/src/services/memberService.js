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

const membersCollection = collection(db, 'members');

export const getMembers = async () => {
    try {
        const q = query(
            membersCollection,
            where('isDeleted', '==', false),
            orderBy('created_at', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const members = [];
        querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() });
        });
        return members;
    } catch (error) {
        console.error('Error getting members:', error);
        throw error;
    }
};

export const getMemberById = async (id) => {
    try {
        const memberDoc = doc(db, 'members', id);
        const docSnap = await getDoc(memberDoc);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Member not found');
        }
    } catch (error) {
        console.error('Error getting member:', error);
        throw error;
    }
};

export const createMember = async (memberData) => {
    try {
        const docRef = await addDoc(membersCollection, {
            ...memberData,
            isDeleted: false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        // Get the created document
        const docSnap = await getDoc(docRef);
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error creating member:', error);
        throw error;
    }
};

export const updateMember = async (id, memberData) => {
    try {
        const memberDoc = doc(db, 'members', id);
        await updateDoc(memberDoc, {
            ...memberData,
            updated_at: serverTimestamp()
        });

        // Get the updated document
        const docSnap = await getDoc(memberDoc);
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error updating member:', error);
        throw error;
    }
};

export const deleteMember = async (id) => {
    try {
        const memberDoc = doc(db, 'members', id);
        await updateDoc(memberDoc, {
            isDeleted: true,
            updated_at: serverTimestamp()
        });
    } catch (error) {
        console.error('Error soft deleting member:', error);
        throw error;
    }
};

export const restoreMember = async (id) => {
    try {
        const memberDoc = doc(db, 'members', id);
        await updateDoc(memberDoc, {
            isDeleted: false,
            updated_at: serverTimestamp()
        });
    } catch (error) {
        console.error('Error restoring member:', error);
        throw error;
    }
};

export const getDeletedMembers = async () => {
    try {
        const q = query(
            membersCollection,
            where('isDeleted', '==', true),
            orderBy('updated_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const members = [];
        querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() });
        });
        return members;
    } catch (error) {
        console.error('Error getting deleted members:', error);
        return [];
    }
};
