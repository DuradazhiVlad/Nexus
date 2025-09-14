import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Globe, Search } from 'lucide-react';

interface LocationLanguageSelectorProps {
  selectedCountry?: string;
  selectedCity?: string;
  selectedLanguage?: string;
  onCountryChange?: (country: string) => void;
  onCityChange?: (city: string) => void;
  onLanguageChange?: (language: string) => void;
  className?: string;
}

const COUNTRIES = [
  'Україна', 'Польща', 'Німеччина', 'Франція', 'Італія', 'Іспанія', 
  'Великобританія', 'США', 'Канада', 'Австралія', 'Японія', 'Корея'
];

const CITIES_BY_COUNTRY: { [key: string]: string[] } = {
  'Україна': [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', 
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Луганськ', 
    'Вінниця', 'Макіївка', 'Севастополь', 'Сімферополь', 'Херсон',
    'Полтава', 'Чернігів', 'Черкаси', 'Житомир', 'Суми', 'Хмельницький',
    'Чернівці', 'Горлівка', 'Рівне', 'Кам\'янське', 'Кропивницький',
    'Івано-Франківськ', 'Кременчук', 'Тернопіль', 'Луцьк', 'Біла Церква',
    'Краматорськ', 'Мелітополь', 'Керч', 'Нікополь', 'Слов\'янськ'
  ],
  'Польща': ['Варшава', 'Краків', 'Лодзь', 'Вроцлав', 'Познань', 'Гданськ'],
  'Німеччина': ['Берлін', 'Гамбург', 'Мюнхен', 'Кельн', 'Франкфурт', 'Штутгарт'],
  'Франція': ['Париж', 'Марсель', 'Ліон', 'Тулуза', 'Ніцца', 'Нант'],
  'США': ['Нью-Йорк', 'Лос-Анджелес', 'Чикаго', 'Х\'юстон', 'Фінікс', 'Філадельфія']
};

const LANGUAGES = [
  'Українська', 'Англійська', 'Польська', 'Німецька', 'Французька', 
  'Іспанська', 'Італійська', 'Російська', 'Китайська', 'Японська', 
  'Корейська', 'Португальська', 'Арабська', 'Хінді'
];

export const LocationLanguageSelector: React.FC<LocationLanguageSelectorProps> = ({
  selectedCountry = '',
  selectedCity = '',
  selectedLanguage = '',
  onCountryChange,
  onCityChange,
  onLanguageChange,
  className = ''
}) => {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  
  // Закриття дропдаунів при кліку поза ними
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Фільтрація опцій
  const filteredCountries = COUNTRIES.filter(country => 
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );
  
  const availableCities = selectedCountry ? (CITIES_BY_COUNTRY[selectedCountry] || []) : [];
  const filteredCities = availableCities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );
  
  const filteredLanguages = LANGUAGES.filter(language => 
    language.toLowerCase().includes(languageSearch.toLowerCase())
  );
  
  const handleCountrySelect = (country: string) => {
    onCountryChange?.(country);
    setIsCountryOpen(false);
    setCountrySearch('');
    // Очищуємо місто при зміні країни
    if (selectedCountry !== country) {
      onCityChange?.('');
    }
  };
  
  const handleCitySelect = (city: string) => {
    onCityChange?.(city);
    setIsCityOpen(false);
    setCitySearch('');
  };
  
  const handleLanguageSelect = (language: string) => {
    onLanguageChange?.(language);
    setIsLanguageOpen(false);
    setLanguageSearch('');
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Вибір країни */}
      <div className="relative" ref={countryRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Країна
        </label>
        <button
          type="button"
          onClick={() => setIsCountryOpen(!isCountryOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span className={selectedCountry ? 'text-gray-900' : 'text-gray-500'}>
              {selectedCountry || 'Оберіть країну'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isCountryOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук країни..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                    selectedCountry === country ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {country}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">Країну не знайдено</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Вибір міста */}
      <div className="relative" ref={cityRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Місто
        </label>
        <button
          type="button"
          onClick={() => setIsCityOpen(!isCityOpen)}
          disabled={!selectedCountry}
          className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white transition-colors ${
            selectedCountry 
              ? 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
              : 'bg-gray-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
              {selectedCity || (selectedCountry ? 'Оберіть місто' : 'Спочатку оберіть країну')}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isCityOpen && selectedCountry && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук міста..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                    selectedCity === city ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {city}
                </button>
              ))}
              {filteredCities.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">Місто не знайдено</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Вибір мови */}
      <div className="relative" ref={languageRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Мова
        </label>
        <button
          type="button"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center">
            <Globe className="w-4 h-4 text-gray-400 mr-2" />
            <span className={selectedLanguage ? 'text-gray-900' : 'text-gray-500'}>
              {selectedLanguage || 'Оберіть мову'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isLanguageOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук мови..."
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                    selectedLanguage === language ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {language}
                </button>
              ))}
              {filteredLanguages.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">Мову не знайдено</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};