import React, { useState } from 'react';
import { Phone, Video } from 'lucide-react';
import { CallManager } from './CallManager';

interface CallButtonsProps {
  currentUserId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
}

export function CallButtons({
  currentUserId,
  participantId,
  participantName,
  participantAvatar,
}: CallButtonsProps) {
  const [showCallManager, setShowCallManager] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  const handleAudioCall = () => {
    setCallType('audio');
    setShowCallManager(true);
  };

  const handleVideoCall = () => {
    setCallType('video');
    setShowCallManager(true);
  };

  const handleCloseCallManager = () => {
    setShowCallManager(false);
  };

  return (
    <>
      <div className="flex space-x-2">
        {/* Кнопка аудіо дзвінка */}
        <button
          onClick={handleAudioCall}
          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          title="Аудіо дзвінок"
        >
          <Phone className="w-5 h-5" />
        </button>
        
        {/* Кнопка відео дзвінка */}
        <button
          onClick={handleVideoCall}
          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          title="Відео дзвінок"
        >
          <Video className="w-5 h-5" />
        </button>
      </div>
      
      {/* Модальне вікно для дзвінка */}
      {showCallManager && (
        <CallManager
          currentUserId={currentUserId}
          participantId={participantId}
          participantName={participantName}
          participantAvatar={participantAvatar}
          onClose={handleCloseCallManager}
        />
      )}
    </>
  );
}