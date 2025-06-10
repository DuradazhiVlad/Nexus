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
  // Додаємо стан для відображення повідомлень користувачеві
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' або 'error'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mediaToDeleteId, setMediaToDeleteId] = useState(null);


  useEffect(() => {
    getProfile();
  }, []);

  // Функція для відображення повідомлень користувачеві (замість alert)
  const showUserMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // Повідомлення зникне через 5 секунд
  };

  // Функція для показу модального вікна підтвердження (замість confirm)
  const confirmAction = (mediaId) => {
    setMediaToDeleteId(mediaId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    if (mediaToDeleteId) {
      await handleMediaDeleteConfirmed(mediaToDeleteId);
      setMediaToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setMediaToDeleteId(null);
  };


  async function getProfile() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      // Отримання даних користувача з таблиці 'users'
      // Використовуємо auth_user_id для пошуку та maybeSingle() замість single()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (userError) {
        console.error('Помилка отримання даних користувача:', userError);
        showUserMessage('Помилка отримання даних користувача.', 'error');
        return;
      }

      // Якщо користувач не знайдений, створюємо новий запис
      if (!userData) {
        const newUserData = {
          auth_user_id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Користувач',
          lastname: authUser.user_metadata?.lastname || '',
          email: authUser.email || '',
          avatar: authUser.user_metadata?.avatar_url || null,
          bio: null,
          city: null,
          birthdate: null,
          notifications: {},
          privacy: {}
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUserData])
          .select()
          .single();

        if (createError) {
          console.error('Помилка створення профілю користувача:', createError);
          showUserMessage('Помилка створення профілю користувача.', 'error');
          return;
        }

        setUser(createdUser);
      } else {
        setUser(userData);
      }

      // Отримання медіаданих
      // Використовуємо auth_user_id для пошуку медіа
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', authUser.id) // Використовуємо authUser.id напряму
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Помилка отримання медіа:', mediaError);
        showUserMessage('Помилка отримання медіафайлів.', 'error');
        return;
      }

      setMedia(mediaData || []);
    } catch (error) {
      console.error('Помилка завантаження профілю:', error);
      showUserMessage('Помилка завантаження профілю.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarUpload = async (event) => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        showUserMessage("Користувач не авторизований.", 'error');
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Завантаження до Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Отримання публічного URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Оновлення профілю користувача
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrl })
        .eq('auth_user_id', authUser.id); // Використовуємо auth_user_id

      if (updateError) throw updateError;

      // Оновлення профілю
      getProfile();
      showUserMessage('Аватар успішно завантажено!');
    } catch (error) {
      console.error('Помилка завантаження аватара:', error);
      showUserMessage('Помилка завантаження аватара.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = async (event) => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        showUserMessage("Користувач не авторизований.", 'error');
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;
      const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

      // Завантаження до Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Отримання публічного URL
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Створення запису медіа в базі даних
      const { error: insertError } = await supabase
        .from('media')
        .insert([
          {
            user_id: authUser.id, // Використовуємо authUser.id напряму
            type: fileType,
            url: publicUrl
          }
        ]);

      if (insertError) throw insertError;

      // Оновлення списку медіа
      getProfile();
      showUserMessage('Медіафайл успішно завантажено!');
    } catch (error) {
      console.error('Помилка завантаження медіа:', error);
      showUserMessage('Помилка завантаження медіа.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Перейменовано для чіткості після введення модального вікна
  const handleMediaDeleteConfirmed = async (mediaId) => {
    try {
      setDeleting(mediaId);

      // Спочатку отримаємо інформацію про медіа
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media')
        .select('url')
        .eq('id', mediaId)
        .single();

      if (fetchError) throw fetchError;

      // Витягуємо шлях до файлу з URL для видалення зі Storage
      const url = new URL(mediaItem.url);
      const pathParts = url.pathname.split('/');
      const storageBucketName = 'media';
      const publicPathSegmentIndex = pathParts.indexOf(storageBucketName);

      let filePath = null;
      if (publicPathSegmentIndex !== -1 && publicPathSegmentIndex < pathParts.length - 1) {
        filePath = pathParts.slice(publicPathSegmentIndex + 1).join('/');
      } else {
        throw new Error('Не вдалося витягти шлях до файлу зі сховища.');
      }

      // Видалення зі сховища
      const { error: storageError } = await supabase.storage
        .from(storageBucketName)
        .remove([filePath]);

      if (storageError) {
        console.warn('Помилка видалення зі сховища (продовжуємо видалення з БД):', storageError);
        showUserMessage(`Помилка видалення файлу зі сховища: ${storageError.message}. Видалення з БД...`, 'error');
      }

      // Видалення з бази даних
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Оновлення списку медіа
      getProfile();
      showUserMessage('Медіафайл успішно видалено!');
    } catch (error) {
      console.error('Помилка при видаленні медіафайлу:', error);
      showUserMessage('Помилка при видаленні медіафайлу.', 'error');
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
                      {user?.name} {user?.lastname}
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
                        {user?.birthdate || 'Не вказано'}
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
                {message && (
                  <div className={`mb-4 p-3 rounded-md text-center ${messageType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                  </div>
                )}
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

                        {/* Кнопка видалення у верхньому правому куті */}
                        <button
                          onClick={() => confirmAction(item.id)} // Змінено на показ модального вікна
                          disabled={deleting === item.id}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          title="Видалити"
                        >
                          {deleting === item.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
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

      {/* Кастомне модальне вікно підтвердження */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-lg font-semibold mb-4">Підтвердження видалення</h3>
            <p className="mb-6">Ви впевнені, що хочете видалити цей медіафайл?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Видалити
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;