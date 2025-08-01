import React from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';

export function GroupDetail() {
  const { groupId } = useParams();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Детальна інформація про групу</h1>
          <p className="text-gray-600">ID групи: {groupId}</p>
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500">Сторінка в розробці...</p>
          </div>
        </div>
      </div>
    </div>
  );
}