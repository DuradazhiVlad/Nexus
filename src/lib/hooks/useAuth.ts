import { useState, useEffect } from 'react';
import { AuthService, AuthState } from '../auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthService.getState());

  useEffect(() => {
    const unsubscribe = AuthService.subscribe(setAuthState);
    return () => unsubscribe();
  }, []);

  return authState;
};