import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CallManagerProps {
  currentUserId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  onClose: () => void;
}

// Типи дзвінків
enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

// Статуси дзвінків
enum CallStatus {
  IDLE = 'idle',
  CALLING = 'calling',
  INCOMING = 'incoming',
  CONNECTED = 'connected',
  ENDED = 'ended',
}

export function CallManager({
  currentUserId,
  participantId,
  participantName,
  participantAvatar,
  onClose,
}: CallManagerProps) {
  // Стан дзвінка
  const [callType, setCallType] = useState<CallType | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  // Референції для медіа елементів
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Референції для WebRTC об'єктів
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callChannelRef = useRef<any>(null);
  
  // Ініціалізація каналу для сигналізації
  useEffect(() => {
    // Створюємо канал для обміну сигналами WebRTC
    const callChannel = supabase.channel(`call:${currentUserId}`);
    
    callChannel
      .on('broadcast', { event: 'call-signal' }, (payload) => {
        // Обробка сигналів WebRTC
        handleSignalingData(payload.payload);
      })
      .on('broadcast', { event: 'call-request' }, (payload) => {
        // Обробка вхідного дзвінка
        if (payload.payload.targetUserId === currentUserId) {
          handleIncomingCall(payload.payload);
        }
      })
      .on('broadcast', { event: 'call-response' }, (payload) => {
        // Обробка відповіді на дзвінок
        if (payload.payload.targetUserId === currentUserId) {
          handleCallResponse(payload.payload);
        }
      })
      .on('broadcast', { event: 'call-end' }, (payload) => {
        // Обробка завершення дзвінка
        if (payload.payload.targetUserId === currentUserId) {
          handleCallEnd();
        }
      })
      .subscribe();
    
    callChannelRef.current = callChannel;
    
    // Очищення при розмонтуванні
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      callChannel.unsubscribe();
    };
  }, [currentUserId]);
  
  // Функція для ініціювання дзвінка
  const startCall = async (type: CallType) => {
    try {
      setCallType(type);
      setCallStatus(CallStatus.CALLING);
      
      // Отримуємо медіа потік
      const constraints = {
        audio: true,
        video: type === CallType.VIDEO,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current && type === CallType.VIDEO) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Створюємо RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Додаємо треки до peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Обробники подій для ICE кандидатів
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingData({
            type: 'ice-candidate',
            candidate: event.candidate,
          });
        }
      };
      
      // Обробник для отримання віддаленого потоку
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      peerConnectionRef.current = peerConnection;
      
      // Надсилаємо запит на дзвінок
      callChannelRef.current.send({
        type: 'broadcast',
        event: 'call-request',
        payload: {
          callerId: currentUserId,
          targetUserId: participantId,
          callType: type,
          timestamp: new Date().toISOString(),
        },
      });
      
      // Створюємо оффер
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      sendSignalingData({
        type: 'offer',
        offer: peerConnection.localDescription,
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus(CallStatus.ENDED);
      onClose();
    }
  };
  
  // Функція для відповіді на дзвінок
  const answerCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTED);
      
      // Отримуємо медіа потік
      const constraints = {
        audio: true,
        video: callType === CallType.VIDEO,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current && callType === CallType.VIDEO) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Створюємо RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Додаємо треки до peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Обробники подій для ICE кандидатів
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingData({
            type: 'ice-candidate',
            candidate: event.candidate,
          });
        }
      };
      
      // Обробник для отримання віддаленого потоку
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      peerConnectionRef.current = peerConnection;
      
      // Надсилаємо відповідь на дзвінок
      callChannelRef.current.send({
        type: 'broadcast',
        event: 'call-response',
        payload: {
          calleeId: currentUserId,
          targetUserId: participantId,
          accepted: true,
          timestamp: new Date().toISOString(),
        },
      });
      
      // Створюємо відповідь
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      sendSignalingData({
        type: 'answer',
        answer: peerConnection.localDescription,
      });
      
    } catch (error) {
      console.error('Error answering call:', error);
      setCallStatus(CallStatus.ENDED);
      onClose();
    }
  };
  
  // Функція для відхилення дзвінка
  const rejectCall = () => {
    callChannelRef.current.send({
      type: 'broadcast',
      event: 'call-response',
      payload: {
        calleeId: currentUserId,
        targetUserId: participantId,
        accepted: false,
        timestamp: new Date().toISOString(),
      },
    });
    
    setCallStatus(CallStatus.ENDED);
    onClose();
  };
  
  // Функція для завершення дзвінка
  const endCall = () => {
    callChannelRef.current.send({
      type: 'broadcast',
      event: 'call-end',
      payload: {
        userId: currentUserId,
        targetUserId: participantId,
        timestamp: new Date().toISOString(),
      },
    });
    
    handleCallEnd();
  };
  
  // Обробник завершення дзвінка
  const handleCallEnd = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    setCallStatus(CallStatus.ENDED);
    onClose();
  };
  
  // Функція для надсилання сигнальних даних
  const sendSignalingData = (data: any) => {
    callChannelRef.current.send({
      type: 'broadcast',
      event: 'call-signal',
      payload: {
        ...data,
        senderId: currentUserId,
        targetId: participantId,
      },
    });
  };
  
  // Обробник сигнальних даних
  const handleSignalingData = async (data: any) => {
    if (data.targetId !== currentUserId) return;
    
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;
    
    try {
      if (data.type === 'offer' && data.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        sendSignalingData({
          type: 'answer',
          answer: peerConnection.localDescription,
        });
      } else if (data.type === 'answer' && data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === 'ice-candidate' && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error handling signaling data:', error);
    }
  };
  
  // Обробник вхідного дзвінка
  const handleIncomingCall = (data: any) => {
    setCallType(data.callType);
    setCallStatus(CallStatus.INCOMING);
  };
  
  // Обробник відповіді на дзвінок
  const handleCallResponse = (data: any) => {
    if (data.accepted) {
      setCallStatus(CallStatus.CONNECTED);
    } else {
      setCallStatus(CallStatus.ENDED);
      onClose();
    }
  };
  
  // Перемикання аудіо
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };
  
  // Перемикання відео
  const toggleVideo = () => {
    if (localStreamRef.current && callType === CallType.VIDEO) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Заголовок */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {callStatus === CallStatus.INCOMING
              ? `Вхідний ${callType === CallType.VIDEO ? 'відео' : 'аудіо'} дзвінок`
              : callStatus === CallStatus.CALLING
              ? `Виклик ${participantName}`
              : `${callType === CallType.VIDEO ? 'Відео' : 'Аудіо'} дзвінок з ${participantName}`}
          </h3>
          <span className="text-sm">
            {callStatus === CallStatus.CONNECTED && (
              <span>00:00</span> // Тут можна додати таймер тривалості дзвінка
            )}
          </span>
        </div>
        
        {/* Основний вміст */}
        <div className="p-4">
          {/* Відображення відео */}
          {callType === CallType.VIDEO && (
            <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden" style={{ height: '360px' }}>
              {/* Віддалене відео (великий екран) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Локальне відео (маленький екран) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-1/4 h-auto rounded border-2 border-white"
              />
              
              {/* Заглушка, якщо немає відео */}
              {callStatus !== CallStatus.CONNECTED && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    {participantAvatar ? (
                      <img
                        src={participantAvatar}
                        alt={participantName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-semibold">
                        {participantName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Аудіо дзвінок або очікування */}
          {(callType === CallType.AUDIO || callStatus !== CallStatus.CONNECTED) && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                {participantAvatar ? (
                  <img
                    src={participantAvatar}
                    alt={participantName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-700 text-2xl font-semibold">
                    {participantName.charAt(0)}
                  </span>
                )}
              </div>
              <h4 className="text-xl font-semibold mb-2">{participantName}</h4>
              <p className="text-gray-500">
                {callStatus === CallStatus.CALLING
                  ? 'Виклик...'
                  : callStatus === CallStatus.INCOMING
                  ? 'Вхідний дзвінок'
                  : 'З'єднано'}
              </p>
            </div>
          )}
          
          {/* Кнопки керування */}
          <div className="flex justify-center space-x-4 mt-4">
            {/* Кнопки для вхідного дзвінка */}
            {callStatus === CallStatus.INCOMING && (
              <>
                <button
                  onClick={rejectCall}
                  className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={answerCall}
                  className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Кнопки для активного дзвінка */}
            {(callStatus === CallStatus.CONNECTED || callStatus === CallStatus.CALLING) && (
              <>
                {/* Мікрофон */}
                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full ${isAudioEnabled ? 'bg-gray-600' : 'bg-red-600'} text-white flex items-center justify-center`}
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                
                {/* Відео (тільки для відео дзвінків) */}
                {callType === CallType.VIDEO && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full ${isVideoEnabled ? 'bg-gray-600' : 'bg-red-600'} text-white flex items-center justify-center`}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </button>
                )}
                
                {/* Завершити дзвінок */}
                <button
                  onClick={endCall}
                  className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}