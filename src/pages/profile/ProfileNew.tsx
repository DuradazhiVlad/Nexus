import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Check, AlertCircle } from 'lucide-react';
import { useProfile, usePosts } from './hooks';
import { 
  ProfileHeader, 
  ProfileInfo, 
  ProfileEditForm, 
  ProfileStats, 
  CreatePostForm, 
  PostsSection 
} from './components';
import { supabase } from '../../lib/supabase';
import { ErrorNotification } from '../../components/ErrorNotification';

export function ProfileNew() {
  const profileHook = useProfile();
  
  if (!profileHook) return <div>Помилка завантаження профілю</div>;
  
  const {
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
    cancelEdit,
    addHobby,
    removeHobby,
    addLanguage,
    removeLanguage,
    updateEditForm,
    updateNestedField
  } = profileHook;

  const {
    postContent,
    setPostContent,
    postMediaUrl,
    setPostMediaUrl,
    postMediaType,
    setPostMediaType,
    creatingPost,
    showEmojiPicker,
    setShowEmojiPicker,
    showMediaInput,
    setShowMediaInput,
    characterCount,
    userPosts,
    setUserPosts,
    loadingPosts,
    MAX_CHARACTERS,
    EMOJIS,
    addEmoji,
    handleCreatePost,
    loadUserPosts
  } = usePosts(currentUser, profile);

  // Monitor profile state changes
  React.useEffect(() => {
    if (profile) {
      console.log('🔄 Profile state updated:');
      console.log('🔍 Profile hobbies:', profile.hobbies);
      console.log('🔍 Profile languages:', profile.languages);
      console.log('🔍 Profile hobbies length:', profile.hobbies?.length);
      console.log('🔍 Profile languages length:', profile.languages?.length);
    }
  }, [profile]);



  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Завантаження профілю...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Помилка завантаження</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Спробувати знову
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Профіль не знайдено</h2>
              <p className="text-gray-600">Не вдалося завантажити дані профілю</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success/Error Messages */}
          {success && (
            <ErrorNotification 
              type="success"
              title="Успіх!"
              message={success}
              autoClose={true}
              duration={3000}
              onClose={() => setSuccess(null)}
            />
          )}
          
          {error && (
            <ErrorNotification 
              type="error"
              title="Помилка!"
              message={error}
              details={error.includes('Помилка аутентифікації') ? 'Перевірте, чи ви авторизовані в системі' : 
                       error.includes('Помилка завантаження профілю') ? 'Спробуйте оновити сторінку' : 
                       error.includes('Помилка збереження профілю') ? 'Перевірте правильність введених даних' : 
                       'Спробуйте пізніше або зверніться до адміністратора'}
              showRetry={error.includes('Помилка завантаження профілю')}
              onRetry={() => window.location.reload()}
              onClose={() => setError(null)}
            />
          )}





          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            isEditing={isEditing}
            saving={saving}
            onEdit={() => setIsEditing(true)}
            onSave={saveProfile}
            onCancel={cancelEdit}
            onAvatarChange={handleAvatarChange}
          />

          {/* Profile Info (when not editing) */}
          {!isEditing && (profile.education || profile.work || profile.phone || profile.website || profile.hobbies?.length || profile.languages?.length) && (
            <ProfileInfo profile={profile} />
          )}

          {/* Profile Edit Form */}
          {isEditing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <ProfileEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                addHobby={addHobby}
                removeHobby={removeHobby}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
                setError={setError}
              />
            </div>
          )}

          {/* Stats */}
          <ProfileStats userPosts={userPosts} friendsCount={profile?.friends_count || 0} />

          {/* Posts Section */}
          <div className="mb-6">
            <CreatePostForm
              profile={profile}
              postContent={postContent}
              setPostContent={setPostContent}
              postMediaUrl={postMediaUrl}
              setPostMediaUrl={setPostMediaUrl}
              postMediaType={postMediaType}
              setPostMediaType={setPostMediaType}
              creatingPost={creatingPost}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              showMediaInput={showMediaInput}
              setShowMediaInput={setShowMediaInput}
              characterCount={characterCount}
              MAX_CHARACTERS={MAX_CHARACTERS}
              EMOJIS={EMOJIS}
              addEmoji={addEmoji}
              handleCreatePost={handleCreatePost}
            />
          </div>

          <PostsSection
            loadingPosts={loadingPosts}
            userPosts={userPosts}
            currentUser={currentUser}
            profile={profile}
            setUserPosts={setUserPosts}
          />
        </div>
      </div>
    </div>
  );
}