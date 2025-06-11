import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Send, Search, MessageCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  other_user: User;
  last_message?: Message;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: User;
}

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  async function getCurrentUser() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations() {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(*),
          participant2:users!conversations_participant2_id_fkey(*)
        `)
        .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        data.map(async (conv: any) => {
          const otherUser = conv.participant1_id === currentUser.id ? conv.participant2 : conv.participant1;
          
          // Отримати останнє повідомлення
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(*)
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Підрахувати непрочитані повідомлення
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function markMessagesAsRead(conversationId: string) {
    if (!currentUser) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: currentUser.id,
            content: newMessage.trim()
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,lastname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', currentUser?.id)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  async function startConversation(user: User) {
    if (!currentUser) return;

    try {
      // Перевірити, чи існує вже розмова
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${user.id}),and(participant1_id.eq.${user.id},participant2_id.eq.${currentUser.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingConv) {
        // Розмова вже існує, вибрати її
        const conversationWithUser = {
          ...existingConv,
          other_user: user,
          unread_count: 0
        };
        setSelectedConversation(conversationWithUser);
      } else {
        // Створити нову розмову
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              participant1_id: currentUser.id,
              participant2_id: user.id
            }
          ])
          .select()
          .single();

        if (createError) throw createError;

        const conversationWithUser = {
          ...newConv,
          other_user: user,
          unread_count: 0
        };
        setSelectedConversation(conversationWithUser);
        loadConversations();
      }

      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      <div className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Список розмов */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Повідомлення</h2>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
              
              {showSearch && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Пошук користувачів..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => startConversation(user)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {user.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name} {user.lastname}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Немає розмов</p>
                  <p className="text-sm">Почніть нову розмову, знайшовши користувача</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        {conversation.other_user.avatar ? (
                          <img 
                            src={conversation.other_user.avatar} 
                            alt={conversation.other_user.name} 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">
                            {conversation.other_user.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-gray-900 truncate">
                            {conversation.other_user.name} {conversation.other_user.lastname}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Область повідомлень */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Заголовок розмови */}
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {selectedConversation.other_user.avatar ? (
                        <img 
                          src={selectedConversation.other_user.avatar} 
                          alt={selectedConversation.other_user.name} 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        <span className="font-medium text-gray-600">
                          {selectedConversation.other_user.name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.other_user.name} {selectedConversation.other_user.lastname}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedConversation.other_user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Повідомлення */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('uk-UA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Поле введення */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Введіть повідомлення..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Виберіть розмову</h3>
                  <p className="text-gray-500">Оберіть розмову зі списку або почніть нову</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}