import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorNotificationProps {
  type: ErrorType;
  title: string;
  message: string;
  details?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  showRetry?: boolean;
  onRetry?: () => void;
}

const getIcon = (type: ErrorType) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-600" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
  }
};

const getStyles = (type: ErrorType) => {
  switch (type) {
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'bg-red-100',
        closeButton: 'text-red-400 hover:text-red-600',
        retryButton: 'bg-red-600 hover:bg-red-700 text-white'
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'bg-yellow-100',
        closeButton: 'text-yellow-400 hover:text-yellow-600',
        retryButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'bg-blue-100',
        closeButton: 'text-blue-400 hover:text-blue-600',
        retryButton: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
    case 'success':
      return {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'bg-green-100',
        closeButton: 'text-green-400 hover:text-green-600',
        retryButton: 'bg-green-600 hover:bg-green-700 text-white'
      };
  }
};

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  type,
  title,
  message,
  details,
  onClose,
  autoClose = true,
  duration = 5000,
  showRetry = false,
  onRetry
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const styles = getStyles(type);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const handleRetry = () => {
    onRetry?.();
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`rounded-lg border p-4 shadow-lg ${styles.container}`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
            {getIcon(type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{title}</h3>
              <button
                onClick={handleClose}
                className={`flex-shrink-0 ml-2 p-1 rounded-md hover:bg-opacity-20 transition-colors ${styles.closeButton}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="mt-1 text-sm">{message}</p>
            
            {details && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs underline hover:no-underline"
                >
                  {showDetails ? 'Сховати деталі' : 'Показати деталі'}
                </button>
                
                {showDetails && (
                  <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs font-mono overflow-auto max-h-32">
                    {details}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-3 flex space-x-2">
              {showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${styles.retryButton}`}
                >
                  Спробувати знову
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for managing multiple notifications
export const useErrorNotifications = () => {
  const [notifications, setNotifications] = useState<Array<ErrorNotificationProps & { id: string }>>([]);

  const addNotification = (notification: Omit<ErrorNotificationProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      onClose: () => removeNotification(id)
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}; 