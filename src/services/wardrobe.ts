import { supabase } from '../lib/supabase';
import { Item, Outfit } from '../types';

const ITEMS_TABLE = 'items';
const OUTFITS_TABLE = 'outfits';

// Local storage fallback for demo/unconfigured state
const localStore = {
  getItems: (): Item[] => JSON.parse(localStorage.getItem('lazy_closet_items') || '[]'),
  setItems: (items: Item[]) => localStorage.setItem('lazy_closet_items', JSON.stringify(items)),
};

export const wardrobeService = {
  async addItem(item: Omit<Item, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from(ITEMS_TABLE)
      .insert([{
        ...item,
        createdAt: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error adding item to Supabase:', error.message);
      // Fallback to local storage if needed
      const items = localStore.getItems();
      const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() } as Item;
      localStore.setItems([...items, newItem]);
      return newItem.id;
    }
    return data[0].id;
  },

  async getItems(userId: string) {
    const { data, error } = await supabase
      .from(ITEMS_TABLE)
      .select('*')
      .eq('ownerId', userId);

    if (error) {
      console.error('Error fetching items from Supabase:', error.message);
      return localStore.getItems();
    }
    return data as Item[];
  },

  subscribeToItems(userId: string, callback: (items: Item[]) => void) {
    // Initial fetch
    this.getItems(userId).then(callback);

    // Subscribe to changes
    const channel = supabase
      .channel('items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: ITEMS_TABLE,
          filter: `ownerId=eq.${userId}`
        },
        () => {
          this.getItems(userId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async deleteItem(itemId: string) {
    const { error } = await supabase
      .from(ITEMS_TABLE)
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item from Supabase:', error.message);
      const items = localStore.getItems().filter(i => i.id !== itemId);
      localStore.setItems(items);
    }
  },

  async addOutfit(outfit: Omit<Outfit, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from(OUTFITS_TABLE)
      .insert([{
        ...outfit,
        createdAt: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error adding outfit to Supabase:', error.message);
      return 'local-id-' + Math.random();
    }
    return data[0].id;
  },

  subscribeToOutfits(userId: string, callback: (outfits: Outfit[]) => void) {
    const fetchOutfits = async () => {
      const { data, error } = await supabase
        .from(OUTFITS_TABLE)
        .select('*')
        .eq('ownerId', userId)
        .order('createdAt', { ascending: false });

      if (!error) {
        callback(data as Outfit[]);
      }
    };

    fetchOutfits();

    const channel = supabase
      .channel('outfits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: OUTFITS_TABLE,
          filter: `ownerId=eq.${userId}`
        },
        fetchOutfits
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
