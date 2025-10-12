import React, { useEffect, useState } from 'react';
import { UserStatsService, UserStats } from '../../../lib/userStatsService';
import { AuthUserProfile } from '../../../lib/authUserService';
import { BarChart, LineChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line } from 'recharts';
import { useProfileEdit } from '../context/ProfileEditContext';

interface ProfileStatsProps {
  profile: AuthUserProfile;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const ProfileStats: React.FC = () => {
  const { profile } = useProfileEdit();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!profile?.id) {
        setStatsLoading(false);
        return;
      }
      try {
        setStatsLoading(true);
        const userStats = await UserStatsService.getUserStats(profile.id);
        setStats(userStats);
      } catch (err) {
        console.error('Error loading user stats:', err);
        setError('Не вдалося завантажити статистику користувача.');
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [profile?.id]);

  if (statsLoading) {
    return <div className="p-4 text-center">Завантаження статистики...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!stats) {
    return <div className="p-4 text-center">Статистика недоступна.</div>;
  }

  const data = [
    { name: 'Друзі', value: stats.friendsCount },
    { name: 'Фото', value: stats.photosCount },
    { name: 'Відео', value: stats.videosCount },
    { name: 'Пости', value: stats.postsCount },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Статистика профілю</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Загальна статистика</h3>
          <ul className="space-y-2">
            <li><span className="font-medium">Друзі:</span> {stats.friendsCount}</li>
            <li><span className="font-medium">Фото:</span> {stats.photosCount}</li>
            <li><span className="font-medium">Відео:</span> {stats.videosCount}</li>
            <li><span className="font-medium">Пости:</span> {stats.postsCount}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Візуалізація даних</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Додаткові графіки можна додати тут, наприклад, для активності за часом */}
      {/* <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Активність за часом</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[{name: 'Січ', posts: 10}, {name: 'Лют', posts: 15}]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="posts" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
};