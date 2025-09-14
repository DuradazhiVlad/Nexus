import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { ErrorNotification } from '../../components/ErrorNotification';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CreatePostForm } from '../profile/components/CreatePostForm';
import { PostsSection } from '../profile/components/PostsSection';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Settings,
  UserPlus,
  UserMinus,
  MapPin,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
  Image,
  Video,
  Crown,
  Shield
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
  avatar?: string;
  category: string;
  privacy: 'public' | 'private' | 'closed';
  members_count: number;
  created_at: string;
  owner_id: string;
  contact_info?: {
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  rules?: string[];
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    name: string;
    last_name?: string;
    avatar?: string;
  };
}

type TabType = 'posts' | 'media' | 'events';

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Post creation states
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video' | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  
  const MAX_CHARACTERS = 2000;
  const EMOJIS = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '👏'];

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadCurrentUser();
    }
  }, [groupId]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_profiles(name, last_name, avatar)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check if current user is member/owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userMembership = membersData?.find(m => m.user_id === user.id);
        setIsMember(!!userMembership);
        setIsOwner(userMembership?.role === 'owner');
      }

      // Load posts if user is member
      if (user && membersData?.find(m => m.user_id === user.id)) {
        loadPosts();
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      setError('Помилка завантаження групи');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles(name, last_name, avatar)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleJoinLeave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isMember) {
        // Leave group
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsMember(false);
      } else {
        // Join group
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: user.id,
            role: 'member'
          });

        if (error) throw error;
        setIsMember(true);
      }

      loadGroupData();
    } catch (error) {
      console.error('Error joining/leaving group:', error);
      setError('Помилка при вступі/виході з групи');
    }
  };

  const addEmoji = (emoji: string) => {
    setPostContent(prev => prev + emoji);
    setCharacterCount(prev => prev + 1);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !currentUser) return;

    try {
      setCreatingPost(true);
      const { error } = await supabase
        .from('posts')
        .insert({
          content: postContent,
          author_id: currentUser.id,
          group_id: groupId,
          media_url: postMediaUrl || null,
          media_type: postMediaType
        });

      if (error) throw error;

      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType(null);
      setCharacterCount(0);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Помилка створення поста');
    } finally {
      setCreatingPost(false);
    }
  };

  const tabs = [
    {
      id: 'posts' as TabType,
      label: 'Пости',
      icon: MessageSquare,
      count: posts.length,
    },
    {
      id: 'media' as TabType,
      label: 'Медіа',
      icon: Image,
      count: 0,
    },
    {
      id: 'events' as TabType,
      label: 'Події',
      icon: Calendar,
      count: 0,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-6">
            {isMember && (
              <CreatePostForm
                profile={currentUser}
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
            )}
            <PostsSection
              loadingPosts={loadingPosts}
              userPosts={posts}
              currentUser={currentUser}
              profile={currentUser}
              setUserPosts={setPosts}
            />
          </div>
        );
      case 'media':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Медіа</h3>
              <p className="text-gray-500">Тут будуть відображатися фото та відео групи</p>
            </div>
          </div>
        );
      case 'events':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Події</h3>
              <p className="text-gray-500">Тут будуть відображатися події групи</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Група не знайдена</h2>
            <p className="text-gray-600">{error || 'Група не існує або була видалена'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="ml-64 max-w-6xl mx-auto px-4 py-6">
        {error && (
          <ErrorNotification
            message={error}
            onClose={() => setError(null)}
          />
        )}
        
        {/* Cover Photo with Group Info */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-700">
            {group.cover_image && (
              <img
                src={group.cover_image}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            )}
            {/* Overlay with group info */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-4xl font-bold mb-3">{group.name}</h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <span className="text-lg">{group.members_count || 0} учасників</span>
                  <span className="text-lg">
                    {group.privacy === 'public' ? 'Відкрита група' : 
                     group.privacy === 'private' ? 'Приватна група' : 'Закрита група'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!isOwner && (
                    <button
                      onClick={handleJoinLeave}
                      className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
                        isMember
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isMember ? (
                        <>
                          <UserMinus className="w-5 h-5 inline mr-2" />
                          Вийти з групи
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 inline mr-2" />
                          Приєднатися
                        </>
                      )}
                    </button>
                  )}
                  {isOwner && (
                    <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Settings className="w-5 h-5 inline mr-2" />
                      Налаштування
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Column - Group Info */}
          <div className="w-80 space-y-4">
            {/* Group Avatar */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {group.name?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                )}
              </div>
              <h2 className="font-semibold text-gray-900">{group.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{group.category || 'Група'}</p>
            </div>

            {/* Group Description */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Опис</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {group.description || 'Опис групи відсутній'}
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Контакти</h3>
              <div className="space-y-2 text-sm">
                {group.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Категорія:</span>
                    <span className="text-gray-900">{group.category}</span>
                  </div>
                )}
                {group.contact_info?.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a 
                      href={group.contact_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {group.contact_info.website}
                    </a>
                  </div>
                )}
                {group.contact_info?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{group.contact_info.phone}</span>
                  </div>
                )}
                {group.contact_info?.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{group.contact_info.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Rules */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Правила</h3>
              <div className="text-gray-700 text-sm leading-relaxed">
                {group.rules && group.rules.length > 0 ? (
                  <ul className="space-y-2">
                    {group.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 font-medium">{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>1. Поважайте один одного<br/>2. Не спамте<br/>3. Дотримуйтесь теми групи</p>
                )}
              </div>
            </div>
            
            {/* Members */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Учасники</h3>
                <span className="text-sm text-gray-500">{members.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {members.slice(0, 9).map((member) => (
                  <div key={member.id} className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mb-1 overflow-hidden">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={member.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {member.user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {member.user.name}
                    </div>
                    {member.role === 'owner' && (
                      <Crown className="w-3 h-3 text-yellow-500 mx-auto" />
                    )}
                    {member.role === 'admin' && (
                      <Shield className="w-3 h-3 text-blue-500 mx-auto" />
                    )}
                  </div>
                ))}
              </div>
              {members.length > 9 && (
                <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Показати всіх учасників
                </button>
              )}
            </div>
          </div>
          
          {/* Right Column - Content */}
          <div className="flex-1 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.count !== null && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}