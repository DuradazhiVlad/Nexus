import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import MediaGallery from './MediaGallery';
import UploadMedia from './UploadMedia';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  bio: string;
  city: string;
  birthDate: string;
  avatar: string | null;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('users_Id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setUser(userData);

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Error fetching media:', mediaError);
        return;
      }

      setMedia(mediaData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header: Avatar + Name + Email + Edit */}
          {user && <ProfileHeader user={user} />}

          {/* Info: Bio, City, BirthDate */}
          {user && <ProfileInfo user={user} />}

          {/* Media Upload */}
          <UploadMedia userId={user?.id} onUpload={getProfile} />

          {/* Media Gallery */}
          <MediaGallery media={media} />
        </div>
      </div>
    </div>
  );
}
