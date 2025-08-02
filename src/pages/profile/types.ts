export interface UserProfile {
  id: string;
  auth_user_id: string;
  name: string;
  last_name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  education?: string;
  phone?: string;
  hobbies?: string[];
  relationship_status?: string;
  work?: string;
  website?: string;
  languages?: string[];
  notifications?: {
    email: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
  };
}

export interface EditFormData {
  name: string;
  last_name: string;
  email: string;
  bio: string;
  city: string;
  birth_date: string;
  avatar: string;
  education: string;
  phone: string;
  hobbies: string[];
  relationship_status: string;
  work: string;
  website: string;
  languages: string[];
  newHobby: string;
  newLanguage: string;
  notifications: {
    email: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy: {
    profileVisibility: 'public';
    showBirthDate: boolean;
    showEmail: boolean;
  };
} 