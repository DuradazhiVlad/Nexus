export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  last_name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  education?: string;
  phone?: string;
  work?: string;
  website?: string;
  relationship_status?: string;
  hobbies?: string[];
  languages?: string[];
  notifications?: any;
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
  };
  created_at: string;
  updated_at?: string;
  lastSeen?: string;
  isOnline?: boolean;
  friendsCount?: number;
  postsCount?: number;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Filters {
  city: string;
  onlineStatus: 'all' | 'online' | 'offline';
  friendStatus: 'all' | 'friends' | 'not_friends' | 'sent' | 'received';
  sortBy: 'date' | 'name' | 'city' | 'lastSeen' | 'popularity';
  sortOrder: 'asc' | 'desc';
  hasAvatar: boolean;
  hasBio: boolean;
}

export type ViewMode = 'grid' | 'list';