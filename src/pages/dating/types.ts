export interface DatingUser {
  id: string;
  auth_user_id: string;
  name: string;
  last_name?: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  bio?: string;
  created_at: string;
}

export interface DatingFilters {
  gender: 'all' | 'male' | 'female' | 'other';
  minAge: number;
  maxAge: number;
  city: string;
  hasPhoto: boolean;
  sortBy: 'newest' | 'name' | 'age';
}

export interface DatingMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  is_mutual: boolean;
}

export interface DatingLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface DatingPass {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}