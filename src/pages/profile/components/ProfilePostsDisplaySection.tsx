import React from 'react';
import { PostCard } from '../../../components/PostCard';
// Remove wrong import path and loosen typing to avoid crash while wiring
import { useProfileEdit } from '../context/ProfileEditContext';

interface ProfilePostsDisplaySectionProps {
  profile: any;
  loadingPosts: boolean;
  userPosts?: any[];
  currentUser: any;
  setUserPosts: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ProfilePostsDisplaySection: React.FC<ProfilePostsDisplaySectionProps> = ({
  profile,
  loadingPosts,
  userPosts,
  currentUser,
  setUserPosts,
}) => {
  if (loadingPosts) {
    return <div className="text-center py-4">Завантаження постів...</div>;
  }

  if (!userPosts || userPosts.length === 0) {
    return <div className="text-center py-4 text-gray-500">Постів поки що немає.</div>;
  }

  return (
    <div className="space-y-4">
      {userPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onDelete={(deletedPostId) => {
            setUserPosts(prev => prev.filter(p => p.id !== deletedPostId));
          }}
        />
      ))}
    </div>
  );
};