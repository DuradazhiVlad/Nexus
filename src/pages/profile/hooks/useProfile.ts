import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { EditFormData } from "../types";
import { getProfileStats } from "../../../lib/profileStatsService";

export const useProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<EditFormData>({} as EditFormData);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        setError("Користувач не знайдений");
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      const { data, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // профіль відсутній – створюємо
        const profileData = {
          auth_user_id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar: user.user_metadata?.avatar_url || null,
          hobbies: [],
          languages: [],
        };
        
        const { data: newProfile, error: insertError } = await supabase
          .from("user_profiles")
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
        } else {
          // Завантажуємо статистику для нового профілю
          try {
            const stats = await getProfileStats(newProfile.id);
            setProfile({ ...newProfile, ...stats });
          } catch (statsError) {
            setProfile(newProfile);
          }
        }
      } else if (profileError) {
        setError(profileError.message);
      } else {
        // Завантажуємо статистику профілю
        try {
          const stats = await getProfileStats(data.id);
          setProfile({ ...data, ...stats });
        } catch (statsError) {
          setProfile(data);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!currentUser) {
      setError("Користувач не авторизований");
      return;
    }
    setSaving(true);
    try {
      const { error: updateError, data: updatedProfile } = await supabase
        .from("user_profiles")
        .update(editForm)
        .eq("auth_user_id", currentUser.id)
        .select()
        .single();

      if (updateError) setError(updateError.message);
      else {
        setProfile(updatedProfile);
        setSuccess("Профіль збережено!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setEditForm(prev => ({ ...prev, avatar: avatarUrl }));
  };

  const addHobby = () => {
    setEditForm(prev => ({
      ...prev,
      hobbies: [...(prev.hobbies || []), ""]
    }));
  };

  const removeHobby = (hobby: string) => {
    setEditForm(prev => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter((h: string) => h !== hobby)
    }));
  };

  const addLanguage = () => {
    setEditForm(prev => ({
      ...prev,
      languages: [...(prev.languages || []), ""]
    }));
  };

  const removeLanguage = (language: string) => {
    setEditForm(prev => ({
      ...prev,
      languages: (prev.languages || []).filter((l: string) => l !== language)
    }));
  };

  const updateEditForm = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parentField: keyof EditFormData, childField: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [parentField]: { ...(prev[parentField] || {}), [childField]: value }
    }));
  };

  const cancelEdit = () => {
    setEditForm(profile || {} as EditFormData);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const refreshProfile = () => {
    loadProfile();
  };

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
    loadProfile,
    refreshProfile,
  };
};
