import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import { GroupsMain } from './components/GroupsMain';

export function Groups() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 mr-4">
        <GroupsMain />
      </div>
    </div>
  );
}