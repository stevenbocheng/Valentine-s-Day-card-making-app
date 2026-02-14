import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCG6paNnE4TnSMNs64Q0lMtqPB4_7YxoJk",
    authDomain: "valentines-day-card-making.firebaseapp.com",
    projectId: "valentines-day-card-making",
    storageBucket: "valentines-day-card-making.firebasestorage.app",
    messagingSenderId: "374825027092",
    appId: "1:374825027092:web:aef158b200e96b913b0901",
    measurementId: "G-40SYN8RE9P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const saveCard = async (data: any) => {
    try {
        // Save to 'cards' collection
        const docRef = await addDoc(collection(db, "cards"), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getCard = async (id: string) => {
    try {
        const docRef = doc(db, "cards", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
};
