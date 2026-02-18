import { useState, useCallback } from 'react';
import { AuthService } from '../../service/AuthService';
import { ApiError } from '../../service/ApiService';

export type RegisterStep = 'email' | 'otp' | 'details';

export interface UseRegisterReturn {
  step: RegisterStep;
  isLoading: boolean;
  error: string | null;
  email: string;
  clearError: () => void;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signup: (password: string, fullName?: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  goBack: () => void;
}

type ErrorContext = 'requestOtp' | 'verifyOtp' | 'signup' | 'resendOtp';

export const useRegister = (): UseRegisterReturn => {
  const [step, setStep] = useState<RegisterStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [signupTicket, setSignupTicket] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const requestOtp = useCallback(async (rawEmail: string) => {
    const normalizedEmail = rawEmail.trim().toLowerCase();
    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) {
        console.log('useRegister - Requesting OTP for:', normalizedEmail);
      }

      await AuthService.requestOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setSignupTicket(null);
      setStep('otp');
    } catch (err) {
      const mapped = mapRegistrationError(err, 'requestOtp');
      setError(mapped.message);
      if (mapped.resetToEmail) {
        setStep('email');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    if (!email) {
      setError('Session expired. Please start over.');
      setStep('email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) {
        console.log('useRegister - Verifying OTP for:', email);
      }

      const ticket = await AuthService.verifyOtp(email, otp);
      setSignupTicket(ticket);
      setStep('details');
    } catch (err) {
      const mapped = mapRegistrationError(err, 'verifyOtp');
      setError(mapped.message);
      if (mapped.resetToEmail) {
        setStep('email');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const signup = useCallback(async (password: string, fullName?: string) => {
    if (!email || !signupTicket) {
      setError('Session expired. Please start over.');
      setStep('email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) {
        console.log('useRegister - Completing signup for:', email);
      }

      await AuthService.signup(
        email,
        password,
        fullName?.trim() || null,
        signupTicket
      );
    } catch (err) {
      const mapped = mapRegistrationError(err, 'signup');
      setError(mapped.message);
      if (mapped.resetToEmail) {
        setStep('email');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [email, signupTicket]);

  const resendOtp = useCallback(async () => {
    if (!email) {
      setStep('email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (__DEV__) {
        console.log('useRegister - Resending OTP for:', email);
      }

      await AuthService.requestOtp(email);
    } catch (err) {
      const mapped = mapRegistrationError(err, 'resendOtp');
      setError(mapped.message);
      if (mapped.resetToEmail) {
        setStep('email');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const goBack = useCallback(() => {
    setError(null);
    if (step === 'details') {
      setStep('otp');
    } else if (step === 'otp') {
      setStep('email');
    }
  }, [step]);

  return {
    step,
    isLoading,
    error,
    email,
    clearError,
    requestOtp,
    verifyOtp,
    signup,
    resendOtp,
    goBack,
  };
};

const mapRegistrationError = (
  error: any,
  context: ErrorContext
): { message: string; resetToEmail?: boolean } => {
  const status =
    error instanceof ApiError
      ? error.status
      : error?.status || error?.response?.status || null;
  const msg = (error?.message || '').toLowerCase();

  if (status === 409 || msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
    return { message: 'This email is already registered. Please log in instead.' };
  }
  if (msg.includes('rate') || msg.includes('too many')) {
    return { message: 'Too many attempts. Please wait a moment and try again.' };
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return { message: 'Network error. Please check your connection and try again.' };
  }

  if (context === 'verifyOtp') {
    if (status === 422 && msg.includes('expired')) {
      return { message: 'Code expired. Request a new one.' };
    }
    if (
      (status === 422 && (msg.includes('invalid') || msg.includes('wrong') || msg.includes('incorrect'))) ||
      msg.includes('invalid') ||
      msg.includes('wrong') ||
      msg.includes('incorrect')
    ) {
      return { message: 'Invalid code. Please try again.' };
    }
    if (status === 422) {
      return { message: 'Invalid code. Please try again.' };
    }
  }

  if (context === 'signup') {
    if (status === 422 && msg.includes('ticket')) {
      return { message: 'Session expired. Please start over.', resetToEmail: true };
    }
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }
  return { message: 'Something went wrong. Please try again.' };
};
