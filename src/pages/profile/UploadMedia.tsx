import React, { useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface UploadMediaProps {
  userId: string;
  onUploadComplete: () => void;
}

export const UploadMedia: React.FC<UploadMediaProps> = ({
  userId,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    const isVideo = file.type.startsWith('video/');

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      await supabase.from('media').insert({
        user_id: userId,
        type: isVideo ? 'video' : 'photo',
        url: publicUrlData.publicUrl,
      });
      onUploadComplete();
    }
  };

  return (
    <div className="my-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Додати фото або відео
      </button>
    </div>
  );
};
export default UploadMedia;
