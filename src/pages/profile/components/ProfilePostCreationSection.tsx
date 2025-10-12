import React, { useState } from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';
import { MessageSquare, Image, Video } from 'lucide-react';
import { CreatePostForm } from './CreatePostForm';
import { EMOJIS } from "../../../lib/constants";
import { supabase } from '../../../lib/supabase';

interface ProfilePostCreationSectionProps {
  profile: AuthUserProfile;
  currentUser: AuthUserProfile | null;
  setUserPosts: React.Dispatch<React.SetStateAction<any[]>>;
}

const MAX_CHARACTERS = 500;

export const ProfilePostCreationSection: React.FC<ProfilePostCreationSectionProps> = ({
  profile,
  currentUser,
  setUserPosts,
}) => {
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video' | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);

  const characterCount = postContent.length;

  const addEmoji = (emoji: string) => {
    setPostContent(prev => prev + emoji);
  };

  const handleCreatePost = async () => {
    if (!profile || !currentUser) return;
    setCreatingPost(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content: postContent,
          media_url: postMediaUrl || null,
          media_type: postMediaType || null,
        })
        .select()
        .single();

      if (error) throw error;

      setUserPosts(prev => [data, ...prev]);
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType(null);
      setShowEmojiPicker(false);
      setShowMediaInput(false);
    } catch (error: any) {
      console.error('Error creating post:', error.message);
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <CreatePostForm
            postContent={postContent}
            setPostContent={setPostContent}
            postMediaUrl={postMediaUrl}
            setPostMediaUrl={setPostMediaUrl}
            postMediaType={postMediaType}
            setPostMediaType={setPostMediaType}
            creatingPost={creatingPost}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            showMediaInput={showMediaInput}
            setShowMediaInput={setShowMediaInput}
            characterCount={characterCount}
            MAX_CHARACTERS={MAX_CHARACTERS}
            EMOJIS={EMOJIS}
            addEmoji={addEmoji}
            handleCreatePost={handleCreatePost}
          />
        </div>
      </div>
    </div>
  );
};