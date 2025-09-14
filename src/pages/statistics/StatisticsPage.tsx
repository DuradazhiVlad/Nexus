import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Sidebar } from '../../components/Sidebar';

interface StatisticsData {
  reach: {
    total_views: number;
    unique_visitors: number;
    followers_views: number;
    non_followers_views: number;
  };
  demographics: {
    gender: { male: number; female: number; other: number };
    age_groups: { [key: string]: number };
  };
  geography: {
    cities: { [key: string]: number };
    countries: { [key: string]: number };
  };
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export const StatisticsPage = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState('reach');

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      // Симуляція даних - в реальному проекті тут буде запит до API
      const mockData: StatisticsData = {
        reach: {
          total_views: 1250,
          unique_visitors: 890,
          followers_views: 650,
          non_followers_views: 240
        },
        demographics: {
          gender: { male: 45, female: 52, other: 3 },
          age_groups: {
            '18-24': 25,
            '25-34': 35,
            '35-44': 20,
            '45-54': 15,
            '55+': 5
          }
        },
        geography: {
          cities: {
            'Київ': 40,
            'Харків': 15,
            'Одеса': 12,
            'Дніпро': 10,
            'Львів': 8,
            'Інші': 15
          },
          countries: {
            'Україна': 85,
            'Польща': 8,
            'Німеччина': 4,
            'Інші': 3
          }
        },
        devices: {
          mobile: 65,
          desktop: 30,
          tablet: 5
        }
      };
      
      setStatistics(mockData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReachTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{statistics?.reach.total_views}</div>
          <div className="text-sm text-gray-600">Загальні перегляди</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">{statistics?.reach.unique_visitors}</div>
          <div className="text-sm text-gray-600">Унікальні відвідувачі</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{statistics?.reach.followers_views}</div>
          <div className="text-sm text-gray-600">Перегляди підписників</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{statistics?.reach.non_followers_views}</div>
          <div className="text-sm text-gray-600">Перегляди не підписників</div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Охоплення аудиторії</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Підписники</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${(statistics?.reach.followers_views || 0) / (statistics?.reach.total_views || 1) * 100}%`}}></div>
              </div>
              <span className="text-sm text-gray-600">{Math.round((statistics?.reach.followers_views || 0) / (statistics?.reach.total_views || 1) * 100)}%</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Не підписники</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{width: `${(statistics?.reach.non_followers_views || 0) / (statistics?.reach.total_views || 1) * 100}%`}}></div>
              </div>
              <span className="text-sm text-gray-600">{Math.round((statistics?.reach.non_followers_views || 0) / (statistics?.reach.total_views || 1) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemographicsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Стать</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Чоловіки</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: `${statistics?.demographics.gender.male}%`}}></div>
                </div>
                <span className="text-sm text-gray-600">{statistics?.demographics.gender.male}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Жінки</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{width: `${statistics?.demographics.gender.female}%`}}></div>
                </div>
                <span className="text-sm text-gray-600">{statistics?.demographics.gender.female}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Інше</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-600 h-2 rounded-full" style={{width: `${statistics?.demographics.gender.other}%`}}></div>
                </div>
                <span className="text-sm text-gray-600">{statistics?.demographics.gender.other}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Вікові групи</h3>
          <div className="space-y-3">
            {Object.entries(statistics?.demographics.age_groups || {}).map(([age, percentage]) => (
              <div key={age} className="flex justify-between items-center">
                <span>{age} років</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: `${percentage}%`}}></div>
                  </div>
                  <span className="text-sm text-gray-600">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeographyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Міста</h3>
          <div className="space-y-3">
            {Object.entries(statistics?.geography.cities || {}).map(([city, percentage]) => (
              <div key={city} className="flex justify-between items-center">
                <span>{city}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${percentage}%`}}></div>
                  </div>
                  <span className="text-sm text-gray-600">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Країни</h3>
          <div className="space-y-3">
            {Object.entries(statistics?.geography.countries || {}).map(([country, percentage]) => (
              <div key={country} className="flex justify-between items-center">
                <span>{country}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: `${percentage}%`}}></div>
                  </div>
                  <span className="text-sm text-gray-600">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDevicesTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Пристрої</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                📱
              </div>
              <span>Мобільні пристрої</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{width: `${statistics?.devices.mobile}%`}}></div>
              </div>
              <span className="text-sm text-gray-600 w-10">{statistics?.devices.mobile}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                💻
              </div>
              <span>Комп'ютери</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{width: `${statistics?.devices.desktop}%`}}></div>
              </div>
              <span className="text-sm text-gray-600 w-10">{statistics?.devices.desktop}%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                📟
              </div>
              <span>Планшети</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full" style={{width: `${statistics?.devices.tablet}%`}}></div>
              </div>
              <span className="text-sm text-gray-600 w-10">{statistics?.devices.tablet}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження статистики...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Статистика</h1>
            <p className="text-gray-600">Аналітика вашого профілю та контенту</p>
          </div>

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { value: '7d', label: '7 днів' },
                { value: '30d', label: '30 днів' },
                { value: '90d', label: '3 місяці' },
                { value: '1y', label: '1 рік' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'reach', label: 'Охоплення', icon: '📊' },
                  { id: 'demographics', label: 'Стать/Вік', icon: '👥' },
                  { id: 'geography', label: 'Географія', icon: '🌍' },
                  { id: 'devices', label: 'Пристрої', icon: '📱' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'reach' && renderReachTab()}
            {activeTab === 'demographics' && renderDemographicsTab()}
            {activeTab === 'geography' && renderGeographyTab()}
            {activeTab === 'devices' && renderDevicesTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;