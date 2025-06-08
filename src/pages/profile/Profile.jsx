import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Camera, Settings, Upload, Trash2 } from 'lucide-react';
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

      console.log('Auth user:', authUser);

      // Get user data - спробуємо різні варіанти пошуку
      let userData = null;
      
      // Спочатку спробуємо знайти за users_Id
      const { data: userData1, error: userError1 } = await supabase
        .from('users')
        .select('*')
        .eq('users_Id', authUser.id)
        .single();

      if (userData1) {
        userData = userData1;
      } else {
        // Якщо не знайшли, спробуємо за email
        const { data: userData2, error: userError2 } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        if (userData2) {
          userData = userData2;
        }
      }

      if (!userData) {
        console.error('User not found in database');
        // Створимо користувача, якщо його немає
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              users_Id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || 'Користувач',
              lastName: authUser.user_metadata?.last_name || '',
              date: new Date().toISOString(),
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return;
        }
        userData = newUser;
      }

      console.log('User data:', userData);
      setUser(userData);

      // Get media data - використовуємо правильний ID
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Error fetching media:', mediaError);
      } else {
        console.log('Media data:', mediaData);
        setMedia(mediaData || []);
      }
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
      const fileName = `${user.users_Id || user.id}-avatar.${fileExt}`;
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

      console.log('Uploading file:', file.name, 'for user:', user.id);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.users_Id || user.id}/${fileName}`;
      const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('URL error:', urlError);
        throw urlError;
      }

      console.log('File uploaded, creating database record...');

      // Create media record
      const { data: insertData, error: insertError } = await supabase
        .from('media')
        .insert([
          {
            user_id: user.id,
            type: fileType,
            url: publicUrl
          }
        ])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Media record created:', insertData);

      // Refresh media list
      getProfile();
      alert('Медіафайл успішно завантажено!');
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Помилка при завантаженні медіафайлу: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMediaDelete = async (mediaId) => {
    if (!confirm('Ви впевнені, що хочете видалити цей медіафайл?')) {
      return;
    }

    try {
      setDeleting(mediaId);
      
      console.log('Deleting media with ID:', mediaId);
      
      // Get media info first
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media')
        .select('url')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Media item to delete:', mediaItem);

      // Extract file path from URL for storage deletion
      const url = new URL(mediaItem.url);
      const pathParts = url.pathname.split('/');
      // Get the file path after /storage/v1/object/public/media/
      const storageIndex = pathParts.indexOf('media');
      if (storageIndex !== -1 && storageIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(storageIndex + 1).join('/');
        
        console.log('Deleting from storage:', filePath);
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([filePath]);

        if (storageError) {
          console.warn('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      console.log('Media deleted successfully');

      // Refresh media list
      getProfile();
      alert('Медіафайл успішно видалено');
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Помилка при видаленні медіафайлу: ' + error.message);
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

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Користувач не знайдений</div>
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
                    Фото та Відео ({media.length})
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
                            onError={(e) => {
                              console.error('Image failed to load:', item.url);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            controls
                            onError={(e) => {
                              console.error('Video failed to load:', item.url);
                            }}
                          />
                        )}
                        
                        {/* Delete button in top right corner */}
                        <button
                          onClick={() => handleMediaDelete(item.id)}
                          disabled={deleting === item.id}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          title="Видалити"
                        >
                          {deleting === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      У вас поки немає медіафайлів
                    </p>
                    <p className="text-sm text-gray-500">
                      Натисніть кнопку "Завантажити" щоб додати фото або відео
                    </p>
                  </div>
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