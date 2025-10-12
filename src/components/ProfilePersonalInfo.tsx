import React from 'react';
import { useProfileEditContext } from '../../context/ProfileEditContext';

export const ProfilePersonalInfo: React.FC = () => {
  const { profile, isEditing, setProfile } = useProfileEditContext();

  if (!profile) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile!,
      [name]: value,
    }));
  };

  return (
    <div className="profile-personal-info-container">
      <h3>Personal Information</h3>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          name="name"
          type="text"
          value={profile.name || ''}
          onChange={handleChange}
          readOnly={!isEditing}
        />
      </div>
      <div>
        <label htmlFor="last_name">Last Name:</label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          value={profile.last_name || ''}
          onChange={handleChange}
          readOnly={!isEditing}
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          value={profile.email || ''}
          readOnly
        />
      </div>
      {/* Add other personal info fields here */}
    </div>
  );
};