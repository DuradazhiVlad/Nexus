import React, { useState } from 'react';
import { Send, Image, Video, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  lastname: string;
  avatar: string | null;
}

interface GroupPostFormProps {
  groupId: string;
  currentUser: User;
  onPostCreated: () => void;
}

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  preview: string;
}

export function GroupPostForm({ groupId, currentUser, onPostCreated }: GroupPostFormProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const preview = URL.createObjectURL(file);
      
      setMediaFiles(prev => [...prev, { file, type, preview }]);
    });
    
    // Очистити input
    event.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMediaFile = async (file: File): Promise<string> => {
    // В реальному додатку тут би був код для завантаження в Supabase Storage
    // Поки що повертаємо mock URL
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Додайте текст або медіафайли');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Створити пост
      const { data: postData, error: postError } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          author_id: currentUser.id,
          content: content.trim()
        })
        .select()
        .single();

      if (postError) throw postError;

      // Завантажити медіафайли
      if (mediaFiles.length > 0) {
        const mediaPromises = mediaFiles.map(async (mediaFile) => {
          const url = await uploadMediaFile(mediaFile.file);
          
          return supabase
            .from('group_post_media')
            .insert({
              post_id: postData.id,
              type: mediaFile.type,
              url: url,
              filename: mediaFile.file.name,
              file_size: mediaFile.file.size
            });
        });

        await Promise.all(mediaPromises);
      }

      // Очистити форму
      setContent('');
      setMediaFiles([]);
      onPostCreated();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Помилка при створенні посту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {currentUser.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Поділіться своїми думками з групою..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          
          {/* Попередній перегляд медіафайлів */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaFiles.map((mediaFile, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {mediaFile.type === 'image' ? (
                      <img 
                        src={mediaFile.preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video size={32} className="text-gray-500" />
                        <span className="ml-2 text-sm text-gray-600">
                          {mediaFile.file.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMediaFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <Image size={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <Video size={20} />
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || (!content.trim() && mediaFiles.length === 0)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Upload size={16} className="mr-2 animate-spin" />
              ) : (
                <Send size={16} className="mr-2" />
              )}
              {loading ? 'Публікація...' : 'Опублікувати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}