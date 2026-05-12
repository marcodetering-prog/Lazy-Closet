export type Category = 'Top' | 'Bottom' | 'Dress' | 'Outerwear' | 'Shoes' | 'Accessory';

export interface Item {
  id: string;
  name: string;
  category: Category;
  color?: string;
  imageUrl: string;
  ownerId: string;
  tags?: string[];
  lastWorn?: string;
  createdAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  ownerId: string;
  occasion?: string;
  weatherType?: string;
  createdAt: string;
  aiSuggestion?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  stylePreferences?: string[];
}
