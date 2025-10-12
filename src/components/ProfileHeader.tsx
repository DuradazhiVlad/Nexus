import React from 'react';
import { useProfileEditContext } from '../context/ProfileEditContext';
import { ProfileImageUpload } from '../components/ProfileImageUpload';

export const ProfileHeader: React.FC = () => {
  const { profile, isEditing, setIsEditing, saveProfile, cancelEdit, handleAvatarChange, saving } = useProfileEditContext();

  if (!profile) return null; // Or a loading state

  return (
    <div className="profile-header-container">
      <div className="avatar-section">
        <ProfileImageUpload
          currentAvatarUrl={profile.avatar_url || ''}
          onAvatarChange={handleAvatarChange}
          isEditing={isEditing}
        />
        <h2>{profile.name} {profile.last_name}</h2>
        <p>{profile.email}</p>
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button onClick={saveProfile} disabled={saving}>Save</button>
            <button onClick={cancelEdit} disabled={saving}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
};