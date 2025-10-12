import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { AuthUserProfile } from '../../../lib/authUserService';
import { X } from 'lucide-react';
import { useProfileEdit } from '../context/ProfileEditContext';

interface UserNotesSectionProps {
  profile: AuthUserProfile | null;
  currentUser: AuthUserProfile | null;
}

export const UserNotesSection: React.FC = () => {
  const { profile, currentUser } = useProfileEdit();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const isOwnProfile = profile?.id === currentUser?.id;

  useEffect(() => {
    if (profile && showNotesModal) {
      loadNotes();
    }
  }, [profile, showNotesModal]);

  const saveNotes = async () => {
    if (!profile) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({ user_id: profile.id, notes: notes }, { onConflict: 'user_id' });

      if (error) throw error;
      alert('Нотатки успішно збережено!');
      setShowNotesModal(false);
    } catch (error: any) {
      console.error('Помилка збереження нотаток:', error.message);
      alert('Помилка збереження нотаток: ' + error.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const loadNotes = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('notes')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      setNotes(data?.notes || '');
    } catch (error: any) {
      console.error('Помилка завантаження нотаток:', error.message);
    }
  };

  const handleNotesClick = async () => {
    if (!profile) return;
    if (isOwnProfile) {
      setShowNotesModal(true);
    } else {
      // Logic for adding/removing friend or other actions for other profiles
      // For now, let's just show the notes modal for own profile
      setShowNotesModal(true); // Or implement friend request logic here
    }
  };

  return (
    <>
      {isOwnProfile && (
        <button
          onClick={handleNotesClick}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-200"
        >
          Нотатки
        </button>
      )}

      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowNotesModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Мої нотатки</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px] text-gray-800"
              placeholder="Напишіть свої нотатки тут..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNotes ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};