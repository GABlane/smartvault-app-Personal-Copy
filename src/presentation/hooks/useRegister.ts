import { useState, useCallback } from 'react';
import { AuthService } from '../../service/AuthService';

export interface UseRegisterReturn {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
}

export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) {
        console.log('useRegister - Registering:', email);
      }

      await AuthService.register(email.trim().toLowerCase(), password, fullName?.trim() || undefined);

      if (__DEV__) {
        console.log('useRegister - Registration successful');
      }
    } catch (err) {
      const message = mapRegistrationError(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    register,
  };
};

const mapRegistrationError = (error: any): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
      return 'This email is already registered. Please log in instead.';
    }
    if (msg.includes('rate') || msg.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (msg.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message || 'Registration failed. Please try again.';
  }
  return 'Registration failed. Please try again.';
};
