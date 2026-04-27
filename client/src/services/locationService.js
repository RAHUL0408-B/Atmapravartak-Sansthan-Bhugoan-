import { db } from '../firebaseConfig';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    serverTimestamp 
} from 'firebase/firestore';

const customLocationsCollection = collection(db, 'custom_locations');

/**
 * Saves a new city/village to the common database if it doesn't already exist.
 * This makes manually entered villages "autosaved forever" for all users.
 */
export const saveCustomLocation = async (district, taluka, cityName) => {
    if (!district || !taluka || !cityName) return;

    try {
        // Check if it already exists to avoid duplicates
        const q = query(
            customLocationsCollection, 
            where('district', '==', district),
            where('taluka', '==', taluka),
            where('name', '==', cityName)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            await addDoc(customLocationsCollection, {
                district,
                taluka,
                name: cityName,
                created_at: serverTimestamp()
            });
            console.log(`Saved new location: ${cityName} in ${taluka}`);
        }
    } catch (error) {
        console.error("Error saving custom location:", error);
    }
};

/**
 * Fetches all custom locations for a specific taluka.
 */
export const getCustomLocations = async (district, taluka) => {
    if (!district || !taluka) return [];

    try {
        const q = query(
            customLocationsCollection, 
            where('district', '==', district),
            where('taluka', '==', taluka)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().name);
    } catch (error) {
        console.error("Error fetching custom locations:", error);
        return [];
    }
};
