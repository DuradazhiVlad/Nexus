import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getUserPosts, createPost } from '../../lib/postService';

export function TestDB() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check authentication
      addResult('🔍 Testing authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
        return;
      }
      if (!user) {
        addResult('❌ No authenticated user');
        return;
      }
      addResult(`✅ User authenticated: ${user.email}`);

      // Test 2: Check user profile
      addResult('🔍 Testing user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (profileError) {
        addResult(`❌ Profile error: ${profileError.message}`);
        return;
      }
      addResult(`✅ Profile found: ${profile.name} (ID: ${profile.id})`);

      // Test 3: Check posts table structure
      addResult('🔍 Testing posts table...');
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);
      
      if (postsError) {
        addResult(`❌ Posts error: ${postsError.message}`);
        return;
      }
      addResult(`✅ Posts table accessible. Found ${posts?.length || 0} posts`);

      // Test 4: Check user posts
      addResult('🔍 Testing getUserPosts function...');
      const { data: userPosts, error: userPostsError } = await getUserPosts(profile.id);
      
      if (userPostsError) {
        addResult(`❌ getUserPosts error: ${userPostsError.message}`);
        return;
      }
      addResult(`✅ getUserPosts successful. Found ${userPosts?.length || 0} user posts`);

      // Test 5: Check posts with joins
      addResult('🔍 Testing posts with user_profiles join...');
      const { data: postsWithUsers, error: joinError } = await supabase
        .from('posts')
        .select(`
          *,
          user_profiles!posts_user_id_fkey (
            id, 
            name, 
            last_name, 
            avatar
          )
        `)
        .eq('user_id', profile.id)
        .limit(5);
      
      if (joinError) {
        addResult(`❌ Join error: ${joinError.message}`);
        return;
      }
      addResult(`✅ Join successful. Found ${postsWithUsers?.length || 0} posts with user data`);

      // Test 6: Check foreign key constraint
      addResult('🔍 Testing foreign key constraint...');
      const { data: constraintCheck, error: constraintError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('user_id', profile.id)
        .limit(1);
      
      if (constraintError) {
        addResult(`❌ Foreign key error: ${constraintError.message}`);
        return;
      }
      addResult(`✅ Foreign key constraint working. User ID: ${profile.id}`);

      addResult('✅ All tests completed successfully!');

    } catch (error) {
      addResult(`❌ Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestPost = async () => {
    setLoading(true);
    addResult('🔍 Creating test post...');
    
    try {
      const { data, error } = await createPost({
        content: 'This is a test post to verify the database is working correctly!',
        media_url: undefined,
        media_type: undefined
      });
      
      if (error) {
        addResult(`❌ Error creating test post: ${error.message}`);
        return;
      }
      
      addResult(`✅ Test post created successfully! Post ID: ${data?.[0]?.id}`);
      
      // Refresh the tests to see the new post
      setTimeout(() => {
        runTests();
      }, 1000);
      
    } catch (error) {
      addResult(`❌ Unexpected error creating test post: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Test Page</h1>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Database Tests'}
          </button>
          
          <button
            onClick={createTestPost}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating Post...' : 'Create Test Post'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click the button above to start testing.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}