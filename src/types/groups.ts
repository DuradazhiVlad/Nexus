export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  cover?: string;
  isPrivate: boolean;
  createdAt: string;
  creatorId: string;
  memberCount: number;
  postCount: number;
  category: string;
  tags: string[];
  location?: string;
  rules?: string[];
  isVerified?: boolean;
  isActive?: boolean;
  lastActivity?: string;
  website?: string;
  contactEmail?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isActive: boolean;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  content: string;
  images?: string[];
  createdAt: string;
  likes: number;
  comments: number;
  isPinned?: boolean;
}