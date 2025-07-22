import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Download, Check } from 'lucide-react';

interface PhotoFiltersProps {
  imageUrl: string;
  onApplyFilter: (filteredImageUrl: string) => void;
  onClose: () => void;
}

const filters = [
  { name: 'Оригінал', filter: 'none', css: '' },
  { name: 'Сепія', filter: 'sepia', css: 'sepia(100%)' },
  { name: 'Ч/Б', filter: 'grayscale', css: 'grayscale(100%)' },
  { name: 'Інверсія', filter: 'invert', css: 'invert(100%)' },
  { name: 'Яскравість', filter: 'brightness', css: 'brightness(150%)' },
  { name: 'Контраст', filter: 'contrast', css: 'contrast(150%)' },
  { name: 'Насиченість', filter: 'saturate', css: 'saturate(200%)' },
  { name: 'Розмиття', filter: 'blur', css: 'blur(2px)' },
  { name: 'Тепло', filter: 'warm', css: 'sepia(30%) saturate(120%) brightness(110%)' },
  { name: 'Холод', filter: 'cool', css: 'hue-rotate(180deg) saturate(120%)' },
  { name: 'Вінтаж', filter: 'vintage', css: 'sepia(50%) contrast(120%) brightness(90%)' },
  { name: 'Драма', filter: 'dramatic', css: 'contrast(150%) brightness(90%) saturate(150%)' },
];

export function PhotoFilters({ imageUrl, onApplyFilter, onClose }: PhotoFiltersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);

  const applyCustomFilter = () => {
    const customCss = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      blur(${blur}px) 
      sepia(${sepia}%) 
      grayscale(${grayscale}%)
    `;
    return customCss.trim();
  };

  const getCurrentFilter = () => {
    if (selectedFilter === 'custom') {
      return applyCustomFilter();
    }
    const filter = filters.find(f => f.filter === selectedFilter);
    return filter ? filter.css : '';
  };

  const applyFilterToCanvas = async (filterCss: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply filter to context
        ctx.filter = filterCss;
        ctx.drawImage(img, 0, 0);
        
        // Get filtered image as data URL
        const filteredImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(filteredImageUrl);
      };
      
      img.src = imageUrl;
    });
  };

  const handleApplyFilter = async () => {
    const filterCss = getCurrentFilter();
    const filteredImageUrl = await applyFilterToCanvas(filterCss);
    
    if (filteredImageUrl) {
      onApplyFilter(filteredImageUrl);
    }
  };

  const resetFilters = () => {
    setSelectedFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setSepia(0);
    setGrayscale(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Редагування фото</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw size={18} className="mr-1" />
              Скинути
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Image Preview */}
          <div className="flex-1 bg-gray-100 p-6 flex items-center justify-center">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-full max-h-96 object-contain rounded-lg"
                style={{ filter: getCurrentFilter() }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Preset Filters */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Фільтри</h3>
                <div className="grid grid-cols-3 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.filter}
                      onClick={() => setSelectedFilter(filter.filter)}
                      className={`relative p-2 rounded-lg border-2 transition-colors ${
                        selectedFilter === filter.filter
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full h-16 bg-gray-200 rounded mb-1 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={filter.name}
                          className="w-full h-full object-cover"
                          style={{ filter: filter.css }}
                        />
                      </div>
                      <span className="text-xs text-gray-700">{filter.name}</span>
                      {selectedFilter === filter.filter && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Controls */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Налаштування</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Яскравість: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={brightness}
                      onChange={(e) => {
                        setBrightness(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Контраст: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={contrast}
                      onChange={(e) => {
                        setContrast(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Насиченість: {saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={saturation}
                      onChange={(e) => {
                        setSaturation(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Розмиття: {blur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={blur}
                      onChange={(e) => {
                        setBlur(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сепія: {sepia}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sepia}
                      onChange={(e) => {
                        setSepia(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ч/Б: {grayscale}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e) => {
                        setGrayscale(Number(e.target.value));
                        setSelectedFilter('custom');
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Застосувати
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}