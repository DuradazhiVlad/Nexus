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
  const [currentUser, setCurrentUser] = useState(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    last_name: '',
    email: '',
    bio: '',
    city: '',
    birth_date: '',
    gender: '',
    age: null,
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
    console.log('🔄 Початок завантаження профілю');
    setLoading(true);
    setError(null);
    
    try {
      // Отримуємо дані користувача з Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        setError(`Помилка аутентифікації: ${authError.message}`);
        return;
      }
      
      if (!authUser) {
        console.log('⚠️ No authenticated user, redirecting to login');
        setError('Для перегляду профілю необхідно увійти в систему');
        setTimeout(() => {
          navigate('/login', { state: { from: location.pathname, message: 'Для перегляду профілю необхідно увійти в систему' } });
        }, 1500);
        return;
      }
      
      console.log('✅ Authenticated user:', authUser.email);
      setCurrentUser(authUser);
      
      // Отримуємо профіль з user_profiles таблиці
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
        console.log('No user profile found, creating new one');
        const newProfile = {
          auth_user_id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Користувач',
          last_name: authUser.user_metadata?.last_name || '',
          email: authUser.email || '',
          bio: '',
          city: '',
          birth_date: '',
          gender: '',
          age: null,
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
        
        const { data: savedProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw new Error('Помилка створення профілю');
        }
        
        console.log('✅ Новий профіль створено:', savedProfile);
        setProfile(savedProfile);
        
        setEditForm({
          name: savedProfile.name,
          last_name: savedProfile.last_name || '',
          email: savedProfile.email,
          bio: savedProfile.bio || '',
          city: savedProfile.city || '',
          birth_date: savedProfile.birth_date || '',
          gender: savedProfile.gender || '',
          age: savedProfile.age || null,
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
        
        setEditForm({
          name: userProfileData.name || '',
          last_name: userProfileData.last_name || '',
          email: userProfileData.email || authUser.email || '',
          bio: userProfileData.bio || '',
          city: userProfileData.city || '',
          birth_date: userProfileData.birth_date || '',
          gender: userProfileData.gender || '',
          age: userProfileData.age || null,
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
    const errors = [];

    if (!editForm.name.trim()) {
      errors.push('Ім\'я є обов\'язковим полем');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.email && !emailRegex.test(editForm.email)) {
      errors.push('Введіть коректну електронну пошту');
    }

    return errors;
  };

  const saveProfile = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Користувач не авторизований');
      }

      const updateData = {
        name: editForm.name,
        last_name: editForm.last_name,
        email: editForm.email,
        bio: editForm.bio,
        city: editForm.city,
        birth_date: editForm.birth_date && editForm.birth_date.trim() !== '' ? editForm.birth_date : null,
        gender: editForm.gender,
        age: editForm.age,
        avatar: editForm.avatar,
        education: editForm.education,
        phone: editForm.phone,
        hobbies: editForm.hobbies,
        relationship_status: editForm.relationship_status,
        work: editForm.work,
        website: editForm.website,
        languages: editForm.languages,
        notifications: editForm.notifications,
        privacy: editForm.privacy,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('auth_user_id', authUser.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      setSuccess('Профіль успішно збережено!');
      setIsEditing(false);
      
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
        gender: profile.gender || '',
        age: profile.age || null,
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
        hobbies: [...prev.hobbies, prev.newHobby.trim()],
        newHobby: ''
      }));
    }
  };

  const removeHobby = (hobby) => {
    setEditForm(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addLanguage = () => {
    if (editForm.newLanguage.trim() && !editForm.languages.includes(editForm.newLanguage.trim())) {
      setEditForm(prev => ({
        ...prev,
        languages: [...prev.languages, prev.newLanguage.trim()],
        newLanguage: ''
      }));
    }
  };

  const removeLanguage = (language) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parentField, childField, value) => {
    setEditForm(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleAvatarChange = (avatarUrl) => {
    setEditForm(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
    loadProfile();
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
    setError,
    setSuccess,
    setIsEditing,
    saveProfile,
    handleAvatarChange,
    addHobby,
    removeHobby,
    addLanguage,
    removeLanguage,
    updateEditForm,
    updateNestedField,
    cancelEdit,
    loadProfile
  };
};