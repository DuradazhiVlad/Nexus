import { supabase, auth } from './supabase';
import { DatabaseService } from './database';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  private static listeners: ((state: AuthState) => void)[] = [];
  private static currentState: AuthState = {
    user: null,
    profile: null,
    loading: true,
    error: null
  };

  // Initialize auth service
  static async initialize() {
    try {
      console.log('Initializing AuthService...');
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        this.updateState({ user: null, profile: null, loading: false, error: error.message });
        return;
      }

      if (session?.user) {
        console.log('Found existing session for:', session.user.email);
        // Get user profile
        try {
          const profile = await DatabaseService.getCurrentUserProfile();
          this.updateState({ 
            user: session.user, 
            profile, 
            loading: false, 
            error: null 
          });
        } catch (profileError) {
          console.error('Error loading profile:', profileError);
          this.updateState({ 
            user: session.user, 
            profile: null, 
            loading: false, 
            error: profileError instanceof Error ? profileError.message : 'Profile load error'
          });
        }
      } else {
        console.log('No existing session found');
        this.updateState({ user: null, profile: null, loading: false, error: null });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        if (session?.user) {
          try {
            const profile = await DatabaseService.getCurrentUserProfile();
            this.updateState({ 
              user: session.user, 
              profile, 
              loading: false, 
              error: null 
            });
          } catch (profileError) {
            console.error('Error loading profile on auth change:', profileError);
            this.updateState({ 
              user: session.user, 
              profile: null, 
              loading: false, 
              error: profileError instanceof Error ? profileError.message : 'Profile load error'
            });
          }
        } else {
          this.updateState({ user: null, profile: null, loading: false, error: null });
        }
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateState({ 
        user: null, 
        profile: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      this.updateState({ ...this.currentState, loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateState({ ...this.currentState, loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ ...this.currentState, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, userData: { name: string; last_name?: string }) {
    try {
      this.updateState({ ...this.currentState, loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            last_name: userData.last_name || '',
          }
        }
      });

      if (error) {
        this.updateState({ ...this.currentState, loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ ...this.currentState, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error signing out:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Get current state
  static getState(): AuthState {
    return this.currentState;
  }

  // Subscribe to auth state changes
  static subscribe(callback: (state: AuthState) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Update state and notify listeners
  private static updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }
}