import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return 'w-4 h-4';
    case 'md':
      return 'w-6 h-6';
    case 'lg':
      return 'w-8 h-8';
    case 'xl':
      return 'w-12 h-12';
    default:
      return 'w-6 h-6';
  }
};

const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue':
      return 'border-blue-600';
    case 'green':
      return 'border-green-600';
    case 'red':
      return 'border-red-600';
    case 'yellow':
      return 'border-yellow-600';
    case 'purple':
      return 'border-purple-600';
    case 'gray':
      return 'border-gray-600';
    default:
      return 'border-blue-600';
  }
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false
}) => {
  const sizeClasses = getSizeClasses(size);
  const colorClasses = getColorClasses(color);

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses} ${colorClasses} border-2 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton loading component
export const SkeletonLoader: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded mb-2 last:mb-0"
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
        />
      ))}
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
};

// Grid skeleton loader
export const GridSkeleton: React.FC<{
  columns?: number;
  rows?: number;
}> = ({ columns = 3, rows = 2 }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {Array.from({ length: columns * rows }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}; 