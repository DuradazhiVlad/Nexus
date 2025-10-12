import { useState, useEffect } from 'react';
import { UserMediaService, UserMedia } from '../../../lib/userMediaService';
import { UserPersonalInfoService } from '../../../lib/userPersonalInfoService';

export const useUserMedia = (profileId: string | undefined) => {
  const [photos, setPhotos] = useState<UserMedia[]>([]);
  const [videos, setVideos] = useState<UserMedia[]>([]);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingPersonalInfo, setLoadingPersonalInfo] = useState(false);
  
  const userMediaService = new UserMediaService();
  const userPersonalInfoService = new UserPersonalInfoService();

  const loadPhotos = async (limit: number = 6) => {
    if (!profileId) return;
    
    setLoadingPhotos(true);
    try {
      const photosList = await userMediaService.loadUserPhotos(profileId, limit);
      setPhotos(photosList);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadVideos = async (limit: number = 4) => {
    if (!profileId) return;
    
    setLoadingVideos(true);
    try {
      const videosList = await userMediaService.loadUserVideos(profileId, limit);
      setVideos(videosList);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadPersonalInfo = async () => {
    if (!profileId) return;
    
    setLoadingPersonalInfo(true);
    try {
      const info = await userPersonalInfoService.loadPersonalInfo(profileId);
      setPersonalInfo(info || {});
    } catch (error) {
      console.error('Error loading personal info:', error);
    } finally {
      setLoadingPersonalInfo(false);
    }
  };

  const uploadPhoto = async (photoFile: File) => {
    if (!profileId) throw new Error('Profile ID is required');
    
    try {
      const newPhoto = await userMediaService.uploadPhoto(profileId, photoFile);
      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    try {
      await userMediaService.deletePhoto(photoId, filePath);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoId: string, filePath: string) => {
    try {
      await userMediaService.deleteVideo(videoId, filePath);
      setVideos(prev => prev.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const updatePersonalInfo = async (updates: any) => {
    if (!profileId) throw new Error('Profile ID is required');
    
    try {
      const updatedInfo = await userPersonalInfoService.updatePersonalInfo(profileId, updates);
      setPersonalInfo(updatedInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating personal info:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (profileId) {
      loadPhotos();
      loadVideos();
      loadPersonalInfo();
    }
  }, [profileId]);

  return {
    photos,
    videos,
    personalInfo,
    loadingPhotos,
    loadingVideos,
    loadingPersonalInfo,
    loadPhotos,
    loadVideos,
    loadPersonalInfo,
    uploadPhoto,
    deletePhoto,
    deleteVideo,
    updatePersonalInfo,
    refreshMedia: () => {
      loadPhotos();
      loadVideos();
    }
  };
};