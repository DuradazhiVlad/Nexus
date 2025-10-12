import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Profile } from '../../types/profile'; // Переконайтеся, що цей шлях правильний
import { createPost, getUserPosts } from '../../lib/postService'; // Переконайтеся, що цей шлях правильний
import ProfileEditContext, { ProfileEditContextType } from '../../context/ProfileEditContext';

export const ProfileEditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(authError?.message || 'Користувач не авторизований');
      }

      setCurrentUser(user);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, posts(*)') // Оновлення запиту для включення постів
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Помилка отримання профілю:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFieldChange = (field: keyof Profile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Користувач не авторизований');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(editedProfile)
        .eq('auth_user_id', user.id);

      if (error) {
        throw error;
      }
      await fetchProfile(); // Оновлюємо дані
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
      console.error('Помилка збереження профілю:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditedProfile(profile); // Скидаємо зміни до початкового профілю
    }
  };

  const handleAvatarChange = async (file: File) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Користувач не авторизований');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('auth_user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
      console.error('Помилка зміни аватара:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (postContent: { content: string; media_url?: string; media_type?: string }) => {
    setLoading(true);
    try {
      const { data, error: createPostError } = await createPost(postContent);
      if (createPostError) {
        throw createPostError;
      }
      await fetchProfile(); // Оновлюємо профіль, щоб побачити новий пост
    } catch (err: any) {
      setError(err.message);
      console.error('Помилка створення поста:', err);
    } finally {
      setLoading(false);
    }
  };

  const value: ProfileEditContextType = {
    profile,
    loading,
    error,
    isEditing,
    editedProfile,
    currentUser,
    setIsEditing,
    setEditedProfile,
    handleFieldChange,
    handleSave,
    handleCancel,
    handleAvatarChange,
    addPost,
  };

  return (
    <ProfileEditContext.Provider value={value}>
      {children}
    </ProfileEditContext.Provider>
  );
};