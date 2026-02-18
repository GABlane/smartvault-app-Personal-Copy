import { UserLoginRequest, UserLoginResponse } from '../types/UserTypes';
import { API_CONFIG } from '../config/api';
import { StorageService } from './StorageService';
import { ApiService } from './ApiService';

/**
 * Authentication Service
 *
 * Handles user authentication, token management, and session lifecycle.
 * Updated to work with /api/v1/auth/* backend endpoints.
 */
export class AuthService {
  private static _initialized = false;

  /**
   * Register the refresh handler with ApiService (breaks circular dependency)
   */
  static initialize(): void {
    if (this._initialized) return;
    ApiService.setRefreshHandler(() => AuthService.refreshToken().then(() => {}));
    this._initialized = true;
  }

  /**
   * Authenticate user login
   * Backend expects OAuth2 form-encoded: username (email) + password
   * Returns access_token + refresh_token (JWT)
   */
  static async login(loginData: UserLoginRequest): Promise<UserLoginResponse> {
    if (__DEV__) {
      console.log('AuthService - Login attempt for:', loginData.email);
    }

    try {
      const responseData = await ApiService.postPublic<UserLoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        { email: loginData.email, password: loginData.password }
      );

      if (!responseData || !responseData.access_token || !responseData.refresh_token) {
        throw new Error('Invalid response format from server');
      }

      // Store both tokens
      await StorageService.setAccessToken(responseData.access_token);
      await StorageService.setRefreshToken(responseData.refresh_token);

      if (__DEV__) {
        console.log('AuthService - Login successful, tokens stored');
      }

      return responseData;
    } catch (error) {
      this.logError('Login', error, { email: loginData.email });
      throw this.processError(error, 'login');
    }
  }

  /**
   * Refresh the access token using the stored refresh token
   * Returns a new token pair (atomic rotation — old refresh token is invalidated)
   */
  static async refreshToken(): Promise<UserLoginResponse> {
    const refreshToken = await StorageService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const responseData = await ApiService.postPublic<UserLoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        { refresh_token: refreshToken }
      );

      if (!responseData || !responseData.access_token || !responseData.refresh_token) {
        throw new Error('Invalid refresh response format');
      }

      // Store rotated tokens
      await StorageService.setAccessToken(responseData.access_token);
      await StorageService.setRefreshToken(responseData.refresh_token);

      if (__DEV__) {
        console.log('AuthService - Token refresh successful');
      }

      return responseData;
    } catch (error) {
      // Refresh failed — clear all tokens (session expired)
      await StorageService.removeAllTokens();
      this.logError('Token Refresh', error);
      throw this.processError(error, 'token refresh');
    }
  }

  /**
   * Logout — revoke refresh token on backend and clear local storage
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      if (refreshToken) {
        await ApiService.postPublic(
          API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
          { refresh_token: refreshToken }
        );
      }
    } catch (error) {
      // Best-effort — still clear local tokens even if backend call fails
      if (__DEV__) {
        console.warn('AuthService - Backend logout failed, clearing local tokens anyway', error);
      }
    } finally {
      await StorageService.removeAllTokens();
    }
  }

  /**
   * Request OTP for registration
   * POST /api/v1/auth/request-otp
   */
  static async requestOtp(email: string): Promise<void> {
    if (__DEV__) {
      console.log('AuthService - Request OTP for:', email);
    }

    try {
      await ApiService.postPublic<void>(
        API_CONFIG.ENDPOINTS.AUTH.REQUEST_OTP,
        { email }
      );

      if (__DEV__) {
        console.log('AuthService - OTP request successful for:', email);
      }
    } catch (error) {
      this.logError('Request OTP', error, { email });
      throw this.processError(error, 'request otp');
    }
  }

  /**
   * Verify OTP and receive signup ticket
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOtp(email: string, otp: string): Promise<string> {
    if (__DEV__) {
      console.log('AuthService - Verify OTP for:', email);
    }

    try {
      const responseData = await ApiService.postPublic<{ signup_ticket: string }>(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP,
        { email, otp }
      );

      if (!responseData || !responseData.signup_ticket) {
        throw new Error('Invalid response format from server');
      }

      if (__DEV__) {
        console.log('AuthService - OTP verified for:', email);
      }

      return responseData.signup_ticket;
    } catch (error) {
      this.logError('Verify OTP', error, { email });
      throw this.processError(error, 'verify otp');
    }
  }

  /**
   * Complete signup using signup ticket
   * POST /api/v1/auth/signup
   */
  static async signup(
    email: string,
    password: string,
    fullName: string | null,
    signupTicket: string
  ): Promise<void> {
    if (__DEV__) {
      console.log('AuthService - Signup attempt for:', email);
    }

    try {
      await ApiService.postPublic<void>(
        API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
        {
          email,
          password,
          full_name: fullName,
          signup_ticket: signupTicket,
        }
      );

      if (__DEV__) {
        console.log('AuthService - Signup successful for:', email);
      }
    } catch (error) {
      this.logError('Signup', error, { email });
      throw this.processError(error, 'signup');
    }
  }

  /**
   * Get stored authentication token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await StorageService.getAccessToken();
    } catch (error) {
      if (__DEV__) {
        console.error('AuthService - Error getting stored token:', error);
      }
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  static async clearToken(): Promise<void> {
    try {
      await StorageService.removeAllTokens();
      if (__DEV__) {
        console.log('AuthService - Tokens cleared successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('AuthService - Error clearing tokens:', error);
      }
    }
  }

  /**
   * Check if user is authenticated (has a stored access token)
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  /**
   * Centralized error logging
   * @private
   */
  private static logError(operation: string, error: any, context?: any): void {
    if (__DEV__) {
      console.error(`AuthService - ${operation} error:`, error);
      if (context) {
        console.error('AuthService - Context:', context);
      }
    }
  }

  /**
   * Process and enhance error messages
   * @private
   */
  private static processError(error: any, operation: string): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error occurred during ${operation}`);
  }
}
