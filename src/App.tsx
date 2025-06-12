import React from 'react';
// Використовуємо HashRouter для сумісності з GitHub Pages
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Users } from 'lucide-react';

// Імпорт ваших компонентів сторінок
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/profile/Profile';
import { Messages } from './pages/Messages';
import { Friends } from './pages/Friends';
import { Settings } from './pages/Settings';
import { Home } from './pages/Home';

// Головна компонента App, яка налаштовує маршрутизацію
function App() {
    return (
        // Використовуємо HashRouter для розгортання на GitHub Pages
        // Це дозволяє маршрутизації працювати без налаштування сервера
        <Router>
            <Routes>
                {/* Маршрут для головної сторінки */}
                <Route path="/" element={<Home />} />
                {/* Маршрути для інших сторінок */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Router>
    );
}

export default App;