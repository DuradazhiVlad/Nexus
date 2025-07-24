import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  UserPlus, 
  UserMinus,
  Lock,
  Globe,
  Calendar,
  Send,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  X,
  Upload
} from 'lucide-react';

export function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [newPost, setNewPost] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [posting, setPosting] = useState(false);
  // Додаємо стейт для редагування опису та аватара
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editAvatar, setEditAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && groupId) {
      fetchGroupDetails();
      fetchGroupPosts();
      fetchGroupMembers();
      checkUserMembership();
    }
  }, [currentUser, groupId]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      setCurrentUser(userProfile);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          created_by_profile:users!groups_created_by_fkey(name, lastname, avatar)
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group details:', error);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          author:users!group_posts_author_id_fkey(name, lastname, avatar),
          media:group_post_media(*)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching group posts:', error);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey(name, lastname, avatar)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const checkUserMembership = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserMembership(data);
    } catch (error) {
      console.error('Error checking user membership:', error);
    }
  };

  const joinGroup = async () => {
    try {
      if (!currentUser) return;

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id,
          role: 'member'
        }]);

      if (error) throw error;

      checkUserMembership();
      fetchGroupMembers();
      alert('Ви успішно приєдналися до групи!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Помилка при приєднанні до групи');
    }
  };

  const leaveGroup = async () => {
    try {
      if (!currentUser || !userMembership) return;

      if (userMembership.role === 'admin') {
        alert('Адміністратор не може покинути групу');
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setUserMembership(null);
      fetchGroupMembers();
      alert('Ви покинули групу');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Помилка при виході з групи');
    }
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedMedia(files);
  };

  const removeMedia = (index) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!currentUser || !userMembership || (!newPost.trim() && selectedMedia.length === 0)) return;

    try {
      setPosting(true);

      // Створюємо пост
      const { data: postData, error: postError } = await supabase
        .from('group_posts')
        .insert([{
          group_id: groupId,
          author_id: currentUser.id,
          content: newPost.trim()
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Завантажуємо медіа якщо є
      if (selectedMedia.length > 0) {
        for (const file of selectedMedia) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `group-posts/${groupId}/${fileName}`;
          const fileType = file.type.startsWith('video/') ? 'video' : 'image';

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

          await supabase
            .from('group_post_media')
            .insert([{
              post_id: postData.id,
              type: fileType,
              url: publicUrl,
              filename: file.name,
              file_size: file.size
            }]);
        }
      }

      setNewPost('');
      setSelectedMedia([]);
      fetchGroupPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Помилка при створенні поста');
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Адміністратор';
      case 'moderator': return 'Модератор';
      default: return 'Учасник';
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

  if (!group) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Група не знайдена</div>
        </div>
      </div>
    );
  }

  const isMember = !!userMembership;
  const isAdmin = userMembership?.role === 'admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/groups')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold text-gray-900 mr-2">
                        {group.name}
                      </h1>
                      {group.is_private ? (
                        <Lock size={16} className="text-gray-500" />
                      ) : (
                        <Globe size={16} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span>{group.member_count || members.length} учасників</span>
                      <span>•</span>
                      <span>Створено {formatDate(group.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {!isMember ? (
                  <button
                    onClick={joinGroup}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Приєднатися
                  </button>
                ) : (
                  <>
                    {!isAdmin && (
                      <button
                        onClick={leaveGroup}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <UserMinus size={18} className="mr-2" />
                        Покинути
                      </button>
                    )}
                    {isAdmin && (
                      <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        <Settings size={18} className="mr-2" />
                        Керувати
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {group.description && (
              <p className="mt-4 text-gray-600">{group.description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-8 py-6">
          {isMember ? (
            <>
              {/* Tabs */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Пости ({posts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'members'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Учасники ({members.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Інформація
                  </button>
                </div>
              </div>

              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {/* Create Post */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={createPost}>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {currentUser?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Поділіться чимось з групою..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />
                          
                          {/* Selected Media Preview */}
                          {selectedMedia.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                              {selectedMedia.map((file, index) => (
                                <div key={index} className="relative">
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {file.type.startsWith('image/') ? (
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Video size={24} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                                <ImageIcon size={18} className="mr-1" />
                                <span className="text-sm">Фото/Відео</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={handleMediaSelect}
                                />
                              </label>
                            </div>
                            <button
                              type="submit"
                              disabled={posting || (!newPost.trim() && selectedMedia.length === 0)}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {posting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              ) : (
                                <Send size={16} className="mr-2" />
                              )}
                              {posting ? 'Публікація...' : 'Опублікувати'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Posts */}
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Post Header */}
                        <div className="p-6 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {post.author?.avatar ? (
                                  <img
                                    src={post.author.avatar}
                                    alt={post.author.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-600">
                                    {post.author?.name?.[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {post.author?.name} {post.author?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(post.created_at)}
                                </p>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                              <MoreHorizontal size={16} className="text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Post Content */}
                        {post.content && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-900">{post.content}</p>
                          </div>
                        )}

                        {/* Post Media */}
                        {post.media && post.media.length > 0 && (
                          <div className="px-6 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {post.media.map((media, index) => (
                                <div key={index} className="rounded-lg overflow-hidden">
                                  {media.type === 'image' ? (
                                    <img
                                      src={media.url}
                                      alt=""
                                      className="w-full h-64 object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={media.url}
                                      className="w-full h-64 object-cover"
                                      controls
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="px-6 py-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <button className="flex items-center text-gray-600 hover:text-red-500">
                                <Heart size={18} className="mr-1" />
                                <span className="text-sm">Подобається</span>
                              </button>
                              <button className="flex items-center text-gray-600 hover:text-blue-500">
                                <MessageCircle size={18} className="mr-1" />
                                <span className="text-sm">Коментувати</span>
                              </button>
                              <button className="flex items-center text-gray-600 hover:text-green-500">
                                <Share size={18} className="mr-1" />
                                <span className="text-sm">Поділитися</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Поки що немає постів
                      </h3>
                      <p className="text-gray-600">
                        Станьте першим, хто поділиться чимось цікавим!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Учасники групи ({members.length})
                    </h3>
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {member.user?.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={member.user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg text-gray-600">
                                  {member.user?.name?.[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900">
                                {member.user?.name} {member.user?.last_name}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  member.role === 'admin' 
                                    ? 'bg-red-100 text-red-800'
                                    : member.role === 'moderator'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {getRoleLabel(member.role)}
                                </span>
                                <span className="ml-2">
                                  Приєднався {formatDate(member.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isAdmin && member.user?.id !== currentUser?.id && (
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-xl mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      <img
                        src={editAvatar ? URL.createObjectURL(editAvatar) : group.avatar || ''}
                        alt="Group avatar"
                        className="w-24 h-24 rounded-full object-cover border border-gray-200"
                      />
                      {isAdmin && (
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setEditAvatar(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
                    <div className="text-gray-600 mb-2">Створено: {formatDate(group.created_at)}</div>
                    <div className="text-gray-600 mb-2">Адміністратор: {members.find(m => m.role === 'admin')?.user?.name || '—'}</div>
                    {editMode ? (
                      <>
                        <textarea
                          className="w-full border rounded p-2 mb-2"
                          rows={3}
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={saving}
                            onClick={async () => {
                              setSaving(true);
                              let avatarUrl = group.avatar;
                              if (editAvatar) {
                                const fileExt = editAvatar.name.split('.').pop();
                                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                                const filePath = `group-avatars/${groupId}/${fileName}`;
                                const { error: uploadError } = await supabase.storage.from('media').upload(filePath, editAvatar);
                                if (!uploadError) {
                                  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
                                  avatarUrl = publicUrl;
                                }
                              }
                              const { error } = await supabase.from('groups').update({ description: editDescription, avatar: avatarUrl }).eq('id', groupId);
                              if (!error) {
                                setGroup({ ...group, description: editDescription, avatar: avatarUrl });
                                setEditMode(false);
                                setEditAvatar(null);
                              }
                              setSaving(false);
                            }}
                          >Зберегти</button>
                          <button
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                            onClick={() => { setEditMode(false); setEditDescription(group.description || ''); setEditAvatar(null); }}
                          >Скасувати</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 text-gray-800 w-full text-center min-h-[48px]">{group.description || 'Опис відсутній'}</div>
                        {isAdmin && (
                          <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => { setEditMode(true); setEditDescription(group.description || ''); }}
                          >Редагувати опис</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Приєднайтеся до групи
              </h3>
              <p className="text-gray-600 mb-6">
                Щоб переглядати пости та брати участь в обговореннях, приєднайтеся до групи
              </p>
              <button
                onClick={joinGroup}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
              >
                <UserPlus size={18} className="mr-2" />
                Приєднатися до групи
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}