import React from 'react';
// Використовуємо HashRouter для сумісності з GitHub Pages
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Імпорт ваших компонентів сторінок
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/profile/Profile';
import { Messages } from './pages/Messages';
import { People } from './pages/People';
import { Groups } from './pages/Groups';
import { Settings } from './pages/Settings';
import { GroupDetail } from './pages/GroupDetail';

// Головна компонента App, яка налаштовує маршрутизацію
function App() {
    return (
        // Використовуємо HashRouter для розгортання на GitHub Pages
        // Це дозволяє маршрутизації працювати без налаштування сервера
        <Router>
            <Routes>
                {/* Головна сторінка перенаправляє на профіль */}
                <Route path="/" element={<Navigate to="/profile" replace />} />
                {/* Маршрути для інших сторінок */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/people" element={<People />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/group/:groupId" element={<GroupDetail />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Router>
    );
}

export default App;