import React, { useState, useRef } from 'react';
import { Camera, Video, X, Send } from 'lucide-react';
import { MediaService } from '../../../lib/mediaService';
import { useProfileEdit } from '../context/ProfileEditContext';

interface PostCreatorProps {
  // profileId: string;
  // currentUserId: string;
  onCreatePost: (
    postData: {
      content: string;
      media_url?: string | null;
      media_type?: string | null;
      author_id: string;
      profile_id: string;
    }
  ) => Promise<void>;
  isCreating: boolean;
}

export const PostCreator: React.FC<PostCreatorProps> = ({
  // profileId,
  // currentUserId,
  onCreatePost,
  isCreating,
}) => {
  const { profile } = useProfileEdit();
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевірка на існування профілю
    if (!profile || (!newPostContent.trim() && !selectedMedia)) {
        console.error("Profile is not available or post content is empty.");
        return;
    }

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (selectedMedia) {
        const uploadResult = await MediaService.uploadPostMedia(selectedMedia);
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      }

      await onCreatePost({
        content: newPostContent,
        media_url: mediaUrl,
        media_type: mediaType,
        author_id: profile.user_id,
        profile_id: profile.id,
      });
      // ...
    } catch (error) {
      // ...
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Що у вас нового?"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {mediaPreview && (
          <div className="mb-4 relative">
            {selectedMedia?.type.startsWith('image/') ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <video
                src={mediaPreview}
                className="max-w-full h-48 object-cover rounded-lg"
                controls
              />
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Camera size={20} />
              <span>Фото</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Video size={20} />
              <span>Відео</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={(!newPostContent.trim() && !selectedMedia) || isCreating}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            <span>{isCreating ? 'Публікація...' : 'Опублікувати'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};