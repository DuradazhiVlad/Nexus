export interface UserDetail {
  id: string;
  auth_user_id: string;
  name: string;
  last_name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  created_at?: string;
  updated_at?: string;
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
  };
  isOnline?: boolean;
  lastSeen?: string;
  friendsCount?: number;
  postsCount?: number;
  hobbies?: string[];
  languages?: string[];
  work?: string;
  education?: string;
  website?: string;
  phone?: string;
  relationship_status?: string;
  cover?: string;
  isverified?: boolean;
}

export interface UserPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export type ViewMode = 'posts' | 'friends' | 'photos' | 'about'; 