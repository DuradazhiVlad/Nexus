import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../lib/database';
import { supabase } from '../lib/supabase';

export function TestDB() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Testing database connection...');

      // Test 1: Check auth status
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Auth Error: ${authError.message}`);
        setLoading(false);
        return;
      }

      console.log('Auth user:', authUser);
      setCurrentUser(authUser);

      // Test 2: Get current user profile
      const currentProfile = await DatabaseService.getCurrentUserProfile();
      console.log('Current profile:', currentProfile);

      // Test 3: Get all users
      const allUsers = await DatabaseService.getAllUsers();
      console.log('All users:', allUsers);
      setUsers(allUsers);

      setLoading(false);
    } catch (err) {
      console.error('Database test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: 'test-user-id', 
          email: 'test@example.com',
          name: 'Test User',
          lastname: 'Test Lastname'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating test user:', error);
        setError(`Error creating test user: ${error.message}`);
      } else {
        console.log('Test user created:', data);
        testDatabase(); // Refresh data
      }
    } catch (err) {
      console.error('Create test user error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : currentUser ? (
              <div>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Verified:</strong> {currentUser.email_confirmed_at ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-orange-600">No authenticated user</p>
            )}
          </div>

          {/* Users List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">All Users ({users.length})</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.map((user, index) => (
                  <div key={user.id || index} className="p-2 border rounded">
                    <p><strong>{user.name} {user.lastname}</strong></p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-gray-500">No users found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={testDatabase}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Test
          </button>
          <button
            onClick={createTestUser}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Test User
          </button>
        </div>

        {/* Console Output */}
        <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Console Output (Check browser console for more details)</h3>
          <p className="text-sm">Open browser developer tools to see detailed logs</p>
        </div>
      </div>
    </div>
  );
}