import React, { useState } from 'react';
import { Upload, Image, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UploadMediaProps {
  userId?: string;
  onUpload: () => void;
}

const UploadMedia: React.FC<UploadMediaProps> = ({ userId, onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      // В реальному додатку тут би був код для завантаження файлу в Supabase Storage
      // Поки що просто симулюємо успішне завантаження
      
      const fileType = file.type.startsWith('image/') ? 'photo' : 'video';
      const mockUrl = URL.createObjectURL(file);
      
      const { error } = await supabase
        .from('media')
        .insert([
          {
            user_id: userId,
            type: fileType,
            url: mockUrl
          }
        ]);

      if (error) throw error;

      onUpload();
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-8 py-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Медіафайли</h3>
        
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Upload size={16} className="mr-2" />
          {uploading ? 'Завантаження...' : 'Завантажити'}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Image size={16} className="mr-1" />
          <span>Фото</span>
        </div>
        <div className="flex items-center">
          <Video size={16} className="mr-1" />
          <span>Відео</span>
        </div>
        <span>• Максимум 10MB</span>
      </div>
    </div>
  );
};

export default UploadMedia;