import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Camera, Settings, Upload } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Profile() {
  const [user, setUser] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('users_Id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setUser(userData);

      // Get media data
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Error fetching media:', mediaError);
        return;
      }

      setMedia(mediaData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarUpload = async (event) => {
    try {
      if (!user || !user.id) {
        console.error("User not loaded yet");
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile
      getProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = async (event) => {
    try {
      if (!user || !user.id) {
        console.error("User not loaded yet");
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Create media record
      const { error: insertError } = await supabase
        .from('media')
        .insert([
          {
            user_id: user.id,
            type: fileType,
            url: publicUrl
          }
        ]);

      if (insertError) throw insertError;

      // Refresh media list
      getProfile();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Error uploading media');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaDelete = async (mediaId) => {
    try {
      setDeleting(mediaId);
      
      // Get media info first
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media')
        .select('url')
        .eq('id', mediaId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const url = new URL(mediaItem.url);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two parts of path

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Refresh media list
      getProfile();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Помилка при видаленні медіафайлу');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="relative -mt-20">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mx-auto">
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center relative group">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl text-gray-600">
                            {user?.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                        <label className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                          />
                          <Camera className="text-white" size={24} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.name} {user?.lastName}
                    </h1>
                    <p className="text-gray-600 mt-1">{user?.email}</p>
                  </div>
                </div>

                <div className="md:w-2/3">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Особиста інформація
                    </h2>
                    <Link
                      to="/settings"
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <Settings size={18} className="mr-1" />
                      Редагувати
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Про мене</h3>
                      <p className="mt-1 text-gray-900">
                        {user?.bio || 'Додайте інформацію про себе в налаштуваннях'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Місто</h3>
                      <p className="mt-1 text-gray-900">
                        {user?.city || 'Не вказано'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Дата народження
                      </h3>
                      <p className="mt-1 text-gray-900">
                        {user?.birthDate || 'Не вказано'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Фото та Відео
                  </h2>
                  <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaUpload}
                      disabled={uploading}
                    />
                    <Upload size={18} className="mr-2" />
                    {uploading ? 'Завантаження...' : 'Завантажити'}
                  </label>
                </div>
                {media.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {media.map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg overflow-hidden relative group"
                      >
                        {item.type === 'photo' ? (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                        
                        {/* Delete button overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                          <button
                            onClick={() => handleMediaDelete(item.id)}
                            disabled={deleting === item.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Видалити"
                          >
                            {deleting === item.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    У вас поки немає медіафайлів
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;