import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Верхній бар */}
      <div className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        {/* Логотип зліва */}
        <div className="flex items-center">
          <span className="text-2xl font-bold text-blue-700">Nexus</span>
        </div>
        {/* Кнопки справа */}
        <div className="space-x-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Вхід
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-gray-100 text-blue-700 font-medium hover:bg-gray-200 transition"
          >
            Реєстрація
          </Link>
        </div>
      </div>

      {/* Основний контент */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Ласкаво просимо до Nexus!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          Nexus — це сучасна соціальна мережа для спілкування, обміну ідеями, створення груп та пошуку нових друзів. Приєднуйтесь до спільноти, знаходьте однодумців, діліться своїми думками та залишайтеся на зв'язку!
        </p>
        <div className="space-x-4">
          <Link
            to="/register"
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition"
          >
            Зареєструватися
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-lg bg-gray-100 text-blue-700 font-semibold text-lg hover:bg-gray-200 transition"
          >
            Увійти
          </Link>
        </div>
      </div>
    </div>
  );
}