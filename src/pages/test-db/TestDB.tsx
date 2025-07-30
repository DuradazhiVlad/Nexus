import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../lib/database';
import { supabase, auth } from '../../lib/supabase';

export function TestDB() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    testDatabase();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);

      addLog('🚀 Starting database connection test...');

      // Test 1: Check environment variables
      addLog('🔍 Checking environment variables...');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Missing environment variables');
      }
      
      addLog(`✅ Environment variables OK (URL: ${url})`);

      // Test 2: Check auth status
      addLog('🔐 Checking authentication status...');
      const { data: { user: authUser }, error: authError } = await auth.getUser();
      
      if (authError) {
        addLog(`❌ Auth Error: ${authError.message}`);
        setError(`Auth Error: ${authError.message}`);
      } else if (authUser) {
        addLog(`✅ User authenticated: ${authUser.email}`);
        setCurrentUser(authUser);
      } else {
        addLog('⚠️ No authenticated user found');
      }

      // Test 3: Get current user profile
      if (authUser) {
        addLog('👤 Getting current user profile...');
        try {
          const currentProfile = await DatabaseService.getCurrentUserProfile();
          if (currentProfile) {
            addLog(`✅ Profile found: ${currentProfile.name} ${currentProfile.lastname}`);
            setCurrentProfile(currentProfile);
          } else {
            addLog('❌ No profile found');
          }
        } catch (profileError) {
          addLog(`❌ Profile error: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`);
        }
      }

      // Test 4: Get all users
      addLog('👥 Fetching all users...');
      try {
        const allUsers = await DatabaseService.getAllUsers();
        addLog(`✅ Fetched ${allUsers.length} users`);
        setUsers(allUsers);
      } catch (usersError) {
        addLog(`❌ Users fetch error: ${usersError instanceof Error ? usersError.message : 'Unknown error'}`);
      }

      // Test 5: Test direct database connection
      addLog('🗄️ Testing direct database connection...');
      try {
        const { data, error: dbError } = await supabase
          .from('users')
          .select('count(*)')
          .single();
        
        if (dbError) {
          addLog(`❌ Database error: ${dbError.message}`);
        } else {
          addLog(`✅ Database connection successful`);
        }
      } catch (dbError) {
        addLog(`❌ Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }

      setLoading(false);
      addLog('✨ Test completed!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`💥 Test failed: ${errorMessage}`);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      addLog('🔑 Testing login...');
      const { data, error } = await auth.signIn('test@example.com', 'testpassword');
      
      if (error) {
        addLog(`❌ Login failed: ${error.message}`);
      } else {
        addLog(`✅ Login successful: ${data.user?.email}`);
        testDatabase(); // Refresh test
      }
    } catch (err) {
      addLog(`❌ Login error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Supabase Database Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Environment Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📋 Environment Info</h2>
            <div className="space-y-2 text-sm">
              <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
              <p><strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Not set ❌'}</p>
              <p><strong>Mode:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</p>
            </div>
          </div>

          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔐 Auth Status</h2>
            {loading ? (
              <p>Loading...</p>
            ) : currentUser ? (
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Verified:</strong> {currentUser.email_confirmed_at ? 'Yes ✅' : 'No ❌'}</p>
                {currentProfile && (
                  <p><strong>Profile:</strong> {currentProfile.name} {currentProfile.lastname}</p>
                )}
              </div>
            ) : (
              <p className="text-orange-600">No authenticated user ⚠️</p>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">👥 Users ({users.length})</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {users.map((user, index) => (
                <div key={user.id || index} className="p-3 border rounded bg-gray-50">
                  <p className="font-medium">{user.name} {user.lastname}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">ID: {user.id}</p>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 col-span-3">No users found 😔</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={testDatabase}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Refresh Test
          </button>
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            🔑 Test Login
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🧹 Clear Logs
          </button>
        </div>

        {/* Logs */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">📜 Test Logs</h3>
            <span className="text-sm text-gray-400">{logs.length} entries</span>
          </div>
          <div className="text-sm font-mono max-h-60 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run a test to see output.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}