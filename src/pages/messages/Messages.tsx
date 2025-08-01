import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { DatabaseService, DatabaseUser } from '../../lib/database';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, UserCircle, MessageCircle } from 'lucide-react';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function Messages() {
  const [conversations, setConversations] = useState([]); // [{id, participant, lastMessage, unreadCount}]
  const [selectedConversation, setSelectedConversation] = useState(null); // {id, participant}
  const [messages, setMessages] = useState([]); // [{id, sender_id, content, created_at}]
  const [currentUser, setCurrentUser] = useState(null); // {id, name, ...}
  const [authUser, setAuthUser] = useState(null); // auth user
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const query = useQuery();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Modern error handling
  const { notifications, addNotification, removeNotification } = useErrorNotifications();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    loadCurrentUser();
  }, [location.key]);

  useEffect(() => {
    if (currentUser && authUser) {
      loadConversations();
    }
  }, [currentUser, authUser]);

  useEffect(() => {
    // Якщо є ?user=ID в url, відкриваємо діалог з цим користувачем
    const userId = query.get('user');
    if (userId && currentUser && authUser) {
      openOrCreateConversationWith(userId);
    }
    // eslint-disable-next-line
  }, [currentUser, authUser]);

  async function loadCurrentUser() {
    try {
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося завантажити профіль користувача'
        });
        return;
      }
      setCurrentUser(user);
      
      // Отримуємо auth user
      const { data: { user: authUserData }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUserData) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані авторизації'
        });
        return;
      }
      setAuthUser(authUserData);
    } catch (error) {
      console.error('Error loading current user:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити дані користувача',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  }

  async function loadConversations() {
    try {
      if (!authUser) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані користувача'
        });
        return;
      }
      
      setLoading(true);
      
      // Отримати всі розмови, де поточний користувач учасник
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${authUser.id},participant2_id.eq.${authUser.id}`)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      // Отримуємо дані учасників окремо
      const participantIds = (data || []).map(conv => 
        conv.participant1_id === authUser.id ? conv.participant2_id : conv.participant1_id
      );
      
      // Отримуємо профілі учасників
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar, auth_user_id')
        .in('auth_user_id', participantIds);
        
      if (profilesError) throw profilesError;
      
      // Створюємо мапу профілів
      const profilesMap = (profiles || []).reduce((map, profile) => {
        map[profile.auth_user_id] = profile;
        return map;
      }, {});
      
      // Формуємо список співрозмовників
      const convs = (data || []).map(conv => {
        const participantId = conv.participant1_id === authUser.id ? conv.participant2_id : conv.participant1_id;
        const participant = profilesMap[participantId];
        return {
          id: conv.id,
          participant,
          updated_at: conv.updated_at,
        };
      });
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити розмови',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: loadConversations
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  async function openOrCreateConversationWith(userId) {
    try {
      if (!authUser) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані користувача'
        });
        return;
      }
      
      // Шукаємо існуючу розмову
      let conv = conversations.find(
        c => c.participant && c.participant.auth_user_id === userId
      );
      
      if (!conv) {
        // Якщо немає, створюємо нову
        const { data, error } = await supabase
          .from('conversations')
          .insert([
            {
              participant1_id: authUser.id,
              participant2_id: userId,
            },
          ])
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Отримуємо профіль учасника
        const { data: participantProfile } = await supabase
          .from('user_profiles')
          .select('id, name, last_name, avatar, auth_user_id')
          .eq('auth_user_id', userId)
          .single();
        
        // Створюємо об'єкт розмови
        conv = {
          id: data.id,
          participant: participantProfile,
          updated_at: data.updated_at,
        };
        
        // Додаємо до списку розмов
        setConversations(prev => [conv, ...prev]);
      }
      
      // Відкриваємо розмову
      setSelectedConversation(conv);
      loadMessages(conv.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося створити розмову',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося завантажити повідомлення',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  async function handleSelectConversation(conv) {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !authUser) return;
    
    try {
      setSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: authUser.id,
            content: newMessage.trim(),
          },
        ]);
        
      if (error) throw error;
      
      setNewMessage('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося надіслати повідомлення',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex">
        {/* Error Notifications */}
        {notifications.map((notification) => (
          <ErrorNotification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
        
        {/* Chat List - Left Side */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Повідомлення</h1>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Завантаження...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Немає розмов</h3>
                <p className="text-gray-500">Почніть розмову з друзями</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      loadMessages(conversation.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {conversation.participant?.avatar ? (
                          <img
                            src={conversation.participant.avatar}
                            alt={conversation.participant.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {conversation.participant?.name?.[0]}{conversation.participant?.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participant?.name} {conversation.participant?.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {conversation.updated_at ? new Date(conversation.updated_at).toLocaleDateString('uk-UA') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Area - Right Side */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {selectedConversation.participant?.avatar ? (
                      <img
                        src={selectedConversation.participant.avatar}
                        alt={selectedConversation.participant.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {selectedConversation.participant?.name?.[0]}{selectedConversation.participant?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.participant?.name} {selectedConversation.participant?.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">Онлайн</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Завантаження повідомлень...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Немає повідомлень</h3>
                    <p className="text-gray-500">Почніть розмову першим повідомленням</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === authUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === authUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('uk-UA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Напишіть повідомлення..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Виберіть розмову</h3>
                <p className="text-gray-500">Оберіть чат зі списку зліва, щоб почати спілкування</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}