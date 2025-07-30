import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { DatabaseService, DatabaseUser } from '../../lib/database';
import { useLocation } from 'react-router-dom';
import { Send, UserCircle } from 'lucide-react';
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
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const query = useQuery();
  const location = useLocation();
  
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
        .select('id, name, last_name, avatar')
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
          .select('id, name, last_name, avatar')
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

  async function loadMessages(conversationId) {
    try {
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
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити повідомлення',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => loadMessages(conversationId)
      });
      setMessages([]);
    }
  }

  async function handleSelectConversation(conv) {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !authUser) return;
    
    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: authUser.id,
            content: messageText.trim(),
          },
        ]);
        
      if (error) throw error;
      
      setMessageText('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося надіслати повідомлення',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => handleSendMessage(e)
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Error Notifications */}
        {notifications.map((notification) => (
          <ErrorNotification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
        
        <div className="max-w-6xl mx-auto">
          {/* Список діалогів */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Діалоги</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-gray-500">Завантаження...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-gray-500">Немає діалогів</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedConversation && selectedConversation.id === conv.id ? 'bg-gray-100' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {conv.participant?.avatar ? (
                        <img src={conv.participant.avatar} alt={conv.participant.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">{conv.participant?.name} {conv.participant?.last_name}</div>
                      <div className="text-xs text-gray-500">Останнє оновлення: {new Date(conv.updated_at).toLocaleString('uk-UA')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Вікно чату */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex items-center border-b border-gray-200 px-6 py-4 bg-white">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {selectedConversation.participant?.avatar ? (
                      <img src={selectedConversation.participant.avatar} alt={selectedConversation.participant.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{selectedConversation.participant?.name} {selectedConversation.participant?.last_name}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-gray-500 text-center mt-8">Немає повідомлень</div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map(msg => {
                        const isOwnMessage = authUser && msg.sender_id === authUser.id;
                        
                        return (
                          <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border'}`}>
                              {msg.content}
                              <div className={`text-xs mt-1 text-right ${isOwnMessage ? 'text-gray-300' : 'text-gray-500'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center px-6 py-4 border-t border-gray-200 bg-white">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Введіть повідомлення..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
                Виберіть діалог для перегляду повідомлень
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}