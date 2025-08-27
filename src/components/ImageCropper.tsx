import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 1 для квадрата, 16/9 для широкого формату тощо
  cropSize?: { width: number; height: number };
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropper = ({
  imageUrl,
  onCrop,
  onCancel,
  aspectRatio = 1,
  cropSize = { width: 300, height: 300 }
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Центруємо зображення
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setPosition({
          x: (containerRect.width - img.width * scale) / 2,
          y: (containerRect.height - img.height * scale) / 2
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl, scale]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleCrop = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Встановлюємо розмір canvas
    canvas.width = cropSize.width;
    canvas.height = cropSize.height;

    // Очищуємо canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Зберігаємо контекст
    ctx.save();

    // Переміщуємо до центру для обертання
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Обертаємо
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Переміщуємо назад
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Малюємо зображення з урахуванням позиції та масштабу
    const drawX = position.x;
    const drawY = position.y;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    // Відновлюємо контекст
    ctx.restore();

    // Конвертуємо в blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  }, [image, scale, position, rotation, cropSize, onCrop]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Обрізати зображення</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Область для обрізання */}
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-move"
          style={{
            width: cropSize.width,
            height: cropSize.height,
            margin: '0 auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {image && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="absolute select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
          )}
          
          {/* Сітка для кращого візуального орієнтування */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full border-2 border-white border-opacity-50">
              <div className="w-full h-1/3 border-b border-white border-opacity-30"></div>
              <div className="w-full h-1/3 border-b border-white border-opacity-30"></div>
            </div>
            <div className="absolute inset-0">
              <div className="h-full w-1/3 border-r border-white border-opacity-30"></div>
              <div className="h-full w-1/3 border-r border-white border-opacity-30 absolute left-1/3"></div>
            </div>
          </div>
        </div>

        {/* Елементи керування */}
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Зменшити"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Збільшити"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRotate}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Повернути"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Кнопки дій */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Зберегти</span>
          </button>
        </div>

        {/* Прихований canvas для обрізання */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};