export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  member_count: number;
  post_count: number;
  created_by_user?: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  is_active: boolean;
  user?: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  author?: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
  group_post_media?: GroupPostMedia[];
}

export interface GroupPostMedia {
  id: string;
  post_id: string;
  type: 'image' | 'video';
  url: string;
  filename?: string;
  file_size?: number;
  thumbnail_url?: string;
  created_at: string;
}