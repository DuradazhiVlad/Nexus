export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
  post_count: number;
  category?: string;
  tags?: string[];
  location?: string;
  website?: string;
  rules?: string[];
  contactemail?: string;
  is_verified?: boolean;
  is_active?: boolean;
  last_activity?: string;
  creator?: {
    name: string;
    last_name: string;
    avatar?: string;
  };
  user_membership?: {
    role: string;
    joined_at: string;
  };
}

export interface CreateGroupForm {
  name: string;
  description: string;
  is_private: boolean;
  category: string;
  location: string;
  website: string;
  contactemail: string;
  rules: string[];
  newRule: string;
}

export interface GroupFilters {
  searchQuery: string;
  categoryFilter: string;
  typeFilter: 'all' | 'public' | 'private';
  membershipFilter: 'all' | 'member' | 'not_member';
  sortBy: 'name' | 'members' | 'activity' | 'created';
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'members' | 'activity' | 'created'; 