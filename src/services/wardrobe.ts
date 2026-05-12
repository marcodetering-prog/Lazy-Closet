import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getDb, handleFirestoreError, OperationType } from '../lib/firebase';
import { Item, Outfit } from '../types';

const ITEMS_COLLECTION = 'items';
const OUTFITS_COLLECTION = 'outfits';

// Local storage fallback for demo/unconfigured state
const localStore = {
  getItems: (): Item[] => JSON.parse(localStorage.getItem('lazy_closet_items') || '[]'),
  setItems: (items: Item[]) => localStorage.setItem('lazy_closet_items', JSON.stringify(items)),
};

export const wardrobeService = {
  async addItem(item: Omit<Item, 'id' | 'createdAt'>) {
    const db = getDb();
    if (!db) {
      const items = localStore.getItems();
      const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() } as Item;
      localStore.setItems([...items, newItem]);
      return newItem.id;
    }
    try {
      const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
        ...item,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, ITEMS_COLLECTION);
    }
  },

  async getItems(userId: string) {
    const db = getDb();
    if (!db) return localStore.getItems();
    try {
      const q = query(collection(db, ITEMS_COLLECTION), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Item[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ITEMS_COLLECTION);
      return [];
    }
  },

  subscribeToItems(userId: string, callback: (items: Item[]) => void) {
    const db = getDb();
    if (!db) {
      const items = localStore.getItems();
      callback(items);
      // Simple poll for local storage changes in other tabs
      const interval = setInterval(() => callback(localStore.getItems()), 2000);
      return () => clearInterval(interval);
    }
    const q = query(collection(db, ITEMS_COLLECTION), where('ownerId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Item[];
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, ITEMS_COLLECTION);
    });
  },

  async deleteItem(itemId: string) {
    const db = getDb();
    if (!db) {
      const items = localStore.getItems().filter(i => i.id !== itemId);
      localStore.setItems(items);
      return;
    }
    try {
      await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${ITEMS_COLLECTION}/${itemId}`);
    }
  },

  async addOutfit(outfit: Omit<Outfit, 'id' | 'createdAt'>) {
    const db = getDb();
    if (!db) {
       console.log('No DB, skipping outfit save');
       return 'local-id-' + Math.random();
    }
    try {
      const docRef = await addDoc(collection(db, OUTFITS_COLLECTION), {
        ...outfit,
        createdAt: new Date().toISOString(), // Use ISO string to make parsing out easy
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, OUTFITS_COLLECTION);
    }
  },

  subscribeToOutfits(userId: string, callback: (outfits: Outfit[]) => void) {
    const db = getDb();
    if (!db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, OUTFITS_COLLECTION), where('ownerId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const outfits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Outfit[];
      outfits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(outfits);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, OUTFITS_COLLECTION);
    });
  }
};
