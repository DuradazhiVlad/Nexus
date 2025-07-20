import React from 'react';
import { Sidebar } from '../components/Sidebar';

export function Messages() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Повідомлення</h1>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600">У вас поки немає повідомлень</p>
          </div>
        </div>
      </div>
    </div>
  );
}