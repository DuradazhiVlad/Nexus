import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { AuthUserService, AuthUserProfile } from '../../../lib/authUserService';
import { EditFormData } from '../types';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    last_name: '',
    email: '',
    bio: '',
    city: '',
    birth_date: '',
    avatar: '',
    education: '',
    phone: '',
    hobbies: [],
    relationship_status: '',
    work: '',
    website: '',
    languages: [],
    newHobby: '',
    newLanguage: '',
    notifications: {
      email: true,
      messages: true,
      friendRequests: true
    },
    privacy: {
      profileVisibility: 'public',
      showBirthDate: true,
      showEmail: false
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading profile...');
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Помилка аутентифікації: ${authError.message}`);
      }
      
      if (!authUser) {
        console.log('No authenticated user, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('✅ Authenticated user:', authUser.email);
      setCurrentUser(authUser);
      
      // Спочатку отримуємо профіль з user_profiles таблиці
      const { data: userProfileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile error:', profileError);
        throw new Error(`Помилка завантаження профілю: ${profileError.message}`);
      }
      
      if (!userProfileData) {
        console.log('🔍 Raw profile data from database:', userProfileData);
        console.log('No user profile found, creating new one');
        const newProfile = {
          auth_user_id: authUser.id,
          name: authUser.user_metadata?.full_name?.split(' ')[0] || 'Користувач',
          last_name: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: authUser.email || '',
          bio: '',
          city: '',
          birth_date: '',
          avatar: '',
          education: '',
          phone: '',
          hobbies: [],
          relationship_status: '',
          work: '',
          website: '',
          languages: [],
          notifications: {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: {
            profileVisibility: 'public' as const,
            showBirthDate: true,
            showEmail: false
          }
        };
        
        const savedProfile = await AuthUserService.createUserProfile(newProfile);
        console.log('✅ User profile created:', savedProfile.id);
        setProfile(savedProfile);
        setEditForm({
          name: savedProfile.name,
          last_name: savedProfile.last_name || '',
          email: savedProfile.email,
          bio: savedProfile.bio || '',
          city: savedProfile.city || '',
          birth_date: savedProfile.birth_date || '',
          avatar: savedProfile.avatar || '',
          education: savedProfile.education || '',
          phone: savedProfile.phone || '',
          hobbies: savedProfile.hobbies || [],
          relationship_status: savedProfile.relationship_status || '',
          work: savedProfile.work || '',
          website: savedProfile.website || '',
          languages: savedProfile.languages || [],
          newHobby: '',
          newLanguage: '',
          notifications: savedProfile.notifications || {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: savedProfile.privacy || {
            profileVisibility: 'public',
            showBirthDate: true,
            showEmail: false
          }
        });
      } else {
        console.log('🔍 Raw profile data from database:', userProfileData);
        console.log('✅ User profile found:', userProfileData.id);
        setProfile(userProfileData);
        
        // Debug hobbies and languages
        console.log('🔍 Profile hobbies in useProfile:', userProfileData.hobbies);
        console.log('🔍 Profile languages in useProfile:', userProfileData.languages);
        console.log('🔍 Hobbies type:', typeof userProfileData.hobbies);
        console.log('🔍 Languages type:', typeof userProfileData.languages);
        console.log('🔍 Hobbies is array:', Array.isArray(userProfileData.hobbies));
        console.log('🔍 Languages is array:', Array.isArray(userProfileData.languages));
        
        setEditForm({
          name: userProfileData.name || '',
          last_name: userProfileData.last_name || '',
          email: userProfileData.email || authUser.email || '',
          bio: userProfileData.bio || '',
          city: userProfileData.city || '',
          birth_date: userProfileData.birth_date || '',
          avatar: userProfileData.avatar || '',
          education: userProfileData.education || '',
          phone: userProfileData.phone || '',
          hobbies: Array.isArray(userProfileData.hobbies) ? userProfileData.hobbies : [],
          relationship_status: userProfileData.relationship_status || '',
          work: userProfileData.work || '',
          website: userProfileData.website || '',
          languages: Array.isArray(userProfileData.languages) ? userProfileData.languages : [],
          newHobby: '',
          newLanguage: '',
          notifications: userProfileData.notifications || {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: userProfileData.privacy || {
            profileVisibility: 'public',
            showBirthDate: true,
            showEmail: false
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Помилка завантаження профілю');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!editForm.name.trim()) {
      errors.push('Ім\'я є обов\'язковим полем');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.email && !emailRegex.test(editForm.email)) {
      errors.push('Невірний формат email');
    }

    if (editForm.phone && !/^[\d\s\-+()]+$/.test(editForm.phone)) {
      errors.push('Невірний формат телефону');
    }

    if (editForm.website && !/^https?:\/\/.+/.test(editForm.website)) {
      errors.push('Веб-сайт повинен починатися з http:// або https://');
    }

    if (editForm.bio && editForm.bio.length > 500) {
      errors.push('Біо не може перевищувати 500 символів');
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }
      
      if (!currentUser) {
        throw new Error('Користувач не авторизований');
      }
      
      const updates = {
        name: editForm.name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        bio: editForm.bio.trim(),
        city: editForm.city.trim(),
        birth_date: editForm.birth_date,
        avatar: editForm.avatar,
        education: editForm.education.trim(),
        phone: editForm.phone.trim(),
        hobbies: editForm.hobbies,
        relationship_status: editForm.relationship_status.trim(),
        work: editForm.work.trim(),
        website: editForm.website.trim(),
        languages: editForm.languages,
        notifications: editForm.notifications,
        privacy: editForm.privacy,
        updated_at: new Date().toISOString()
      };
      
      await AuthUserService.updateFullProfile(updates);
      
      setSuccess('Профіль успішно оновлено!');
      setIsEditing(false);
      await loadProfile();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : 'Помилка збереження профілю');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    if (profile) {
      setEditForm({
        name: profile.name,
        last_name: profile.last_name || '',
        email: profile.email,
        bio: profile.bio || '',
        city: profile.city || '',
        birth_date: profile.birth_date || '',
        avatar: profile.avatar || '',
        education: profile.education || '',
        phone: profile.phone || '',
        hobbies: profile.hobbies || [],
        relationship_status: profile.relationship_status || '',
        work: profile.work || '',
        website: profile.website || '',
        languages: profile.languages || [],
        newHobby: '',
        newLanguage: '',
        notifications: profile.notifications || {
          email: true,
          messages: true,
          friendRequests: true
        },
        privacy: profile.privacy || {
          profileVisibility: 'public',
          showBirthDate: true,
          showEmail: false
        }
      });
    }
  };

  const addHobby = () => {
    if (editForm.newHobby.trim() && !editForm.hobbies.includes(editForm.newHobby.trim())) {
      setEditForm(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, editForm.newHobby.trim()],
        newHobby: ''
      }));
    }
  };

  const removeHobby = (hobby: string) => {
    setEditForm(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addLanguage = () => {
    if (editForm.newLanguage.trim() && !editForm.languages.includes(editForm.newLanguage.trim())) {
      setEditForm(prev => ({
        ...prev,
        languages: [...prev.languages, editForm.newLanguage.trim()],
        newLanguage: ''
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setEditForm(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    success,
    isEditing,
    saving,
    currentUser,
    editForm,
    setEditForm,
    setIsEditing,
    handleSaveProfile,
    handleCancelEdit,
    handleAvatarChange,
    addHobby,
    removeHobby,
    addLanguage,
    removeLanguage,
    setError,
    setSuccess
  };
};