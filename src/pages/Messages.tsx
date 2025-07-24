import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { DatabaseService, DatabaseUser } from '../lib/database';
import { useLocation } from 'react-router-dom';
import { Send, UserCircle } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function Messages() {
  const [conversations, setConversations] = useState([]); // [{id, participant, lastMessage, unreadCount}]
  const [selectedConversation, setSelectedConversation] = useState(null); // {id, participant}
  const [messages, setMessages] = useState([]); // [{id, sender_id, content, created_at}]
  const [currentUser, setCurrentUser] = useState(null); // {id, name, ...}
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const query = useQuery();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    // Якщо є ?user=ID в url, відкриваємо діалог з цим користувачем
    const userId = query.get('user');
    if (userId && currentUser) {
      openOrCreateConversationWith(userId);
    }
    // eslint-disable-next-line
  }, [currentUser]);

  async function loadCurrentUser() {
    const user = await DatabaseService.getCurrentUserProfile();
    setCurrentUser(user);
  }

  async function loadConversations() {
    setLoading(true);
    // Отримати всі розмови, де поточний користувач учасник
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!conversations_participant1_id_fkey (id, name, lastName, avatar),
        participant2:users!conversations_participant2_id_fkey (id, name, lastName, avatar)
      `)
      .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
      .order('updated_at', { ascending: false });
    if (error) {
      setConversations([]);
      setLoading(false);
      return;
    }
    // Формуємо список співрозмовників
    const convs = (data || []).map(conv => {
      const participant = conv.participant1_id === currentUser.id ? conv.participant2 : conv.participant1;
      return {
        id: conv.id,
        participant,
        updated_at: conv.updated_at,
      };
    });
    setConversations(convs);
    setLoading(false);
  }

  async function openOrCreateConversationWith(userId) {
    // Шукаємо існуючу розмову
    let conv = conversations.find(
      c => c.participant && c.participant.id === userId
    );
    if (!conv) {
      // Якщо немає, створюємо нову
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            participant1_id: currentUser.id,
            participant2_id: userId,
          },
        ])
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey (id, name, lastName, avatar),
          participant2:users!conversations_participant2_id_fkey (id, name, lastName, avatar)
        `)
        .single();
      if (error) return;
      const participant = data.participant1_id === currentUser.id ? data.participant2 : data.participant1;
      conv = { id: data.id, participant, updated_at: data.updated_at };
      setConversations(prev => [conv, ...prev]);
    }
    setSelectedConversation(conv);
    loadMessages(conv.id);
  }

  async function loadMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      setMessages([]);
      return;
    }
    setMessages(data || []);
  }

  async function handleSelectConversation(conv) {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          content: messageText.trim(),
        },
      ]);
    setSending(false);
    setMessageText('');
    if (!error) {
      loadMessages(selectedConversation.id);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex">
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
                    <div className="font-semibold text-gray-900">{conv.participant?.name} {conv.participant?.lastName}</div>
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
                  <div className="font-semibold text-gray-900">{selectedConversation.participant?.name} {selectedConversation.participant?.lastName}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-center mt-8">Немає повідомлень</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border'}`}>
                          {msg.content}
                          <div className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
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
  );
}