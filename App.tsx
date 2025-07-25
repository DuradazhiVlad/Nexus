import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Users as UsersIcon } from 'lucide-react';
import { AuthService } from './src/lib/auth';
import { Login } from './src/pages/Login';
import { Register } from './src/pages/Register';
<<<<<<< HEAD
=======
import { Profile } from './src/pages/profile/Profile';
import { Reels } from './src/pages/Reels';
>>>>>>> 83dc61f003b1abd728baca7e02c949d739926236
import { Messages } from './src/pages/Messages';
import { Friends } from './src/pages/Friends';
import { Settings } from './src/pages/Settings';
import { Groups } from './src/pages/Groups';
import { GroupDetail } from './src/pages/GroupDetail';
<<<<<<< HEAD
import { Games } from './Games';
import Wall from './src/pages/Wall';
=======
import { People } from './src/pages/People';
import { Games } from './src/pages/Games';
import { TestDB } from './src/pages/TestDB';
>>>>>>> 83dc61f003b1abd728baca7e02c949d739926236

// Auth initialization component
function AuthInitializer() {
  useEffect(() => {
    AuthService.initialize();
  }, []);

  return null;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Соціальна мережа
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Вхід
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Реєстрація
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Ласкаво просимо до нашої спільноти
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Приєднуйтесь до нашої соціальної мережі, щоб спілкуватися з друзями,
            ділитися моментами та знаходити нові знайомства.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Спілкування</h3>
              <p className="text-gray-600">
                Спілкуйтеся з друзями та знаходьте нові знайомства
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Контент</h3>
              <p className="text-gray-600">
                Діліться фото, відео та іншими матеріалами
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Приватність</h3>
              <p className="text-gray-600">
                Повний контроль над вашими даними та приватністю
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <AuthInitializer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<<<<<<< HEAD
=======
        <Route path="/profile" element={<Profile />} />
        <Route path="/reels" element={<Reels />} />
>>>>>>> 83dc61f003b1abd728baca7e02c949d739926236
        <Route path="/messages" element={<Messages />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/people" element={<People />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/games" element={<Games />} />
<<<<<<< HEAD
        <Route path="/wall" element={<Wall />} />
=======
        <Route path="/test-db" element={<TestDB />} />
>>>>>>> 83dc61f003b1abd728baca7e02c949d739926236
      </Routes>
    </>
  );
}

export default App;
