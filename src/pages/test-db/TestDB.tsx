import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DatabaseService } from '../../lib/database';

export function TestDB() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testHobbiesAndLanguages = async () => {
    try {
      setLoading(true);
      addLog('🔍 Testing hobbies and languages...');

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`);
        return;
      }
      if (!user) {
        addLog('❌ No authenticated user');
        return;
      }
      addLog(`✅ Authenticated user: ${user.email}`);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        addLog(`❌ Profile error: ${profileError.message}`);
        return;
      }

      addLog(`✅ Profile found: ${profile.id}`);
      addLog(`🔍 Raw profile data: ${JSON.stringify(profile, null, 2)}`);
      addLog(`🔍 Hobbies type: ${typeof profile.hobbies}`);
      addLog(`🔍 Hobbies value: ${JSON.stringify(profile.hobbies)}`);
      addLog(`🔍 Languages type: ${typeof profile.languages}`);
      addLog(`🔍 Languages value: ${JSON.stringify(profile.languages)}`);

      // Test updating hobbies and languages
      const testHobbies = ['Програмування', 'Подорожі', 'Спорт'];
      const testLanguages = ['Українська', 'Англійська', 'Німецька'];

      addLog('🔄 Testing update with hobbies and languages...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          hobbies: testHobbies,
          languages: testLanguages,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (updateError) {
        addLog(`❌ Update error: ${updateError.message}`);
        return;
      }

      addLog('✅ Update successful');

      // Fetch updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (fetchError) {
        addLog(`❌ Fetch error: ${fetchError.message}`);
        return;
      }

      addLog(`✅ Updated profile fetched`);
      addLog(`🔍 Updated hobbies: ${JSON.stringify(updatedProfile.hobbies)}`);
      addLog(`🔍 Updated languages: ${JSON.stringify(updatedProfile.languages)}`);

    } catch (error) {
      addLog(`❌ Test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Test - Hobbies & Languages</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testHobbiesAndLanguages}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Hobbies & Languages'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 ml-2"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Results:</h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click the test button above.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}