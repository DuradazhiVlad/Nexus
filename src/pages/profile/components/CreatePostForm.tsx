import React from 'react';
import { Send, Smile, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface CreatePostFormProps {
  profile: UserProfile;
  postContent: string;
  setPostContent: (content: string) => void;
  postMediaUrl: string;
  setPostMediaUrl: (url: string) => void;
  postMediaType: string;
  setPostMediaType: (type: string) => void;
  creatingPost: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showMediaInput: boolean;
  setShowMediaInput: (show: boolean) => void;
  characterCount: number;
  MAX_CHARACTERS: number;
  EMOJIS: string[];
  addEmoji: (emoji: string) => void;
  handleCreatePost: (e: any) => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  profile,
  postContent,
  setPostContent,
  postMediaUrl,
  setPostMediaUrl,
  postMediaType,
  setPostMediaType,
  creatingPost,
  showEmojiPicker,
  setShowEmojiPicker,
  showMediaInput,
  setShowMediaInput,
  characterCount,
  MAX_CHARACTERS,
  EMOJIS,
  addEmoji,
  handleCreatePost
}) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div className="flex-1">
            <form onSubmit={handleCreatePost}>
              <textarea
                className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent"
                placeholder="Що нового?"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                rows={3}
                maxLength={MAX_CHARACTERS}
              />
              
              {/* Character count and actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaInput(!showMediaInput)}
                    className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${characterCount > MAX_CHARACTERS ? 'text-red-500' : 'text-gray-500'}`}>
                    {characterCount}/{MAX_CHARACTERS}
                  </span>
                  <button
                    type="submit"
                    disabled={creatingPost || !postContent.trim() || characterCount > MAX_CHARACTERS}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                  >
                    {creatingPost ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send size={14} className="mr-2" />
                    )}
                    {creatingPost ? 'Створення...' : 'Опублікувати'}
                  </button>
                </div>
              </div>
            </form>
            
            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="grid grid-cols-8 gap-2">
                  {EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addEmoji(emoji)}
                      className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Media input */}
            {showMediaInput && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Посилання на медіа (необов'язково)"
                  value={postMediaUrl}
                  onChange={e => setPostMediaUrl(e.target.value)}
                />
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={postMediaType}
                  onChange={e => setPostMediaType(e.target.value)}
                >
                  <option value="">Тип медіа</option>
                  <option value="photo">Фото</option>
                  <option value="video">Відео</option>
                  <option value="document">Документ</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 