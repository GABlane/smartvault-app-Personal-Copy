import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRegistrationRequest, UserRegistrationResponse, UserLoginRequest, UserLoginResponse, User, ApiError, VaultMembersResponse, VaultMembershipResponse } from '../types/UserTypes';
import { API_CONFIG } from '../config/api';
import { StorageService } from './StorageService';
import { ApiService } from './ApiService';

export class UserService {
  private static readonly API_TIMEOUT = 10000; // 10 seconds

  /**
   * Register a new user account
   * @param registrationData - User registration data
   * @returns Promise<UserRegistrationResponse>
   * @throws Error with specific message based on API response
   */
  static async register(registrationData: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.REGISTER}`;

    if (__DEV__) {
      console.log('UserService - Registration attempt for:', registrationData.username);
      console.log('UserService - Target URL:', url);
      console.log('UserService - BASE_URL:', API_CONFIG.BASE_URL);
    }

    // Test basic connectivity first
    try {
      if (__DEV__) {
        console.log('UserService - Testing basic connectivity...');
      }
      const testResponse = await fetch(`${API_CONFIG.BASE_URL}/`, {
        method: 'GET'
      });
      if (__DEV__) {
        console.log('UserService - Server connectivity test result:', testResponse.status, testResponse.ok);
      }
    } catch (connectivityError) {
      if (__DEV__) {
        console.error('UserService - Server connectivity failed:', connectivityError);
        console.error('UserService - This suggests the server is not reachable from the React Native app');
      }
    }

    try {
      if (__DEV__) {
        console.log('UserService - Making fetch request to:', url);
        console.log('UserService - Request headers:', {
          'Content-Type': 'application/json',
        });
        console.log('UserService - Request body:', JSON.stringify(registrationData));
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (__DEV__) {
        console.log('UserService - Response status:', response.status);
        console.log('UserService - Response ok:', response.ok);
      }

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (__DEV__) {
        console.log('UserService - Response content-type:', contentType);
      }

      let responseData: UserRegistrationResponse;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // If not JSON, get the text to see what we got
        const text = await response.text();
        if (__DEV__) {
          console.error('UserService - Non-JSON response received:', text);
        }
        throw new Error('Server returned non-JSON response. Please check your API connection.');
      }

      if (!response.ok) {
        // Handle specific error cases based on status codes
        switch (response.status) {
          case 409:
            throw new Error('User already exists with this username or email');
          case 422:
            throw new Error('Password and confirmation password do not match');
          case 400:
            throw new Error('Invalid registration data provided');
          case 500:
            throw new Error('Server error occurred during registration');
          default:
            const errorMessage = responseData.detail || 'Registration failed';
            throw new Error(errorMessage);
        }
      }

      if (__DEV__) {
        console.log('UserService - Registration successful for:', registrationData.username);
      }

      return responseData;

    } catch (error) {
       if (__DEV__) {
         console.error('UserService - Registration error:', error);

         // Type-safe error logging
         if (error instanceof Error) {
           console.error('UserService - Error type:', error.constructor.name);
           console.error('UserService - Error message:', error.message);
           console.error('UserService - Error stack:', error.stack);

           // Check if it's a timeout error
           if (error.name === 'AbortError' || error.message.includes('timeout')) {
             console.error('UserService - This appears to be a timeout error');
             console.error('UserService - The request timed out after', this.API_TIMEOUT, 'ms');
           }
         } else {
           console.error('UserService - Non-Error object thrown:', error);
         }

         // Log additional context for debugging
         console.error('UserService - BASE_URL being used:', API_CONFIG.BASE_URL);
         console.error('UserService - Full registration URL:', url);
         console.error('UserService - Registration data being sent:', JSON.stringify(registrationData, null, 2));

         // Check if it's a network error (TypeError is not an Error instance)
         if (error instanceof TypeError && 'message' in error && error.message.includes('fetch')) {
           console.error('UserService - This appears to be a network connectivity error');
           console.error('UserService - Possible causes:');
           console.error('UserService - 1. Server is not running');
           console.error('UserService - 2. Incorrect BASE_URL');
           console.error('UserService - 3. Network connectivity issues');
           console.error('UserService - 4. Firewall blocking the request');
         }
       }

       // Re-throw with more context if it's already a handled error
       if (error instanceof Error) {
         throw error;
       }

       // Handle network errors
       throw new Error('Network error occurred during registration');
     }
  }

  /**
   * Authenticate user login
   * @param loginData - User login credentials
   * @returns Promise<UserLoginResponse>
   * @throws Error with specific message based on API response
   */
  static async login(loginData: UserLoginRequest): Promise<UserLoginResponse> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.LOGIN}`;

    if (__DEV__) {
      console.log('UserService - Login attempt for:', loginData.username);
      console.log('UserService - Target URL:', url);
      console.log('UserService - BASE_URL:', API_CONFIG.BASE_URL);
    }

    try {
      if (__DEV__) {
        console.log('UserService - Making login request to:', url);
        console.log('UserService - Request headers:', {
          'Content-Type': 'application/x-www-form-urlencoded',
        });
      }

      // Create form data for login (backend expects form-encoded data)
      const formData = new URLSearchParams();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (__DEV__) {
        console.log('UserService - Response status:', response.status);
        console.log('UserService - Response ok:', response.ok);
      }

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        // If response is not JSON, use status text
        responseData = { detail: response.statusText };
      }

      if (!response.ok) {
        // Handle specific error cases based on status codes
        switch (response.status) {
          case 401:
            throw new Error('Invalid username or password');
          case 400:
            throw new Error('Invalid login credentials provided');
          case 500:
            throw new Error('Server error occurred during login');
          default:
            const errorMessage = (responseData && responseData.detail) || 'Login failed';
            throw new Error(errorMessage);
        }
      }

      // Validate response structure for successful login
      if (!responseData || !responseData.access_token || !responseData.token_type) {
        throw new Error('Invalid response format from server');
      }

      if (__DEV__) {
        console.log('UserService - Login successful for:', loginData.username);
      }

      // Store the token after successful login
      if (responseData.access_token) {
        await this.storeToken(responseData.access_token);
      }

      return responseData;

    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Login error:', error);

        // Type-safe error logging
        if (error instanceof Error) {
          console.error('UserService - Error type:', error.constructor.name);
          console.error('UserService - Error message:', error.message);
          console.error('UserService - Error stack:', error.stack);

          // Check if it's a timeout error
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            console.error('UserService - This appears to be a timeout error');
            console.error('UserService - The request timed out after', this.API_TIMEOUT, 'ms');
          }
        } else {
          console.error('UserService - Non-Error object thrown:', error);
        }

        // Log additional context for debugging
        console.error('UserService - BASE_URL being used:', API_CONFIG.BASE_URL);
        console.error('UserService - Full login URL:', url);
        console.error('UserService - Login data being sent:', { username: loginData.username, password: '***' });

        // Check if it's a network error (TypeError is not an Error instance)
        if (error instanceof TypeError && 'message' in error && error.message.includes('fetch')) {
          console.error('UserService - This appears to be a network connectivity error');
          console.error('UserService - Possible causes:');
          console.error('UserService - 1. Server is not running');
          console.error('UserService - 2. Incorrect BASE_URL');
          console.error('UserService - 3. Network connectivity issues');
          console.error('UserService - 4. Firewall blocking the request');
        }
      }

      // Re-throw with more context if it's already a handled error
      if (error instanceof Error) {
        throw error;
      }

      // Handle network errors
      throw new Error('Network error occurred during login');
    }
  }

  /**
    * Fetch users who share vault access with the specified user
    * @param userId - The user ID to find shared vault access for
    * @returns Promise<User[]>
    * @throws Error with specific message based on API response
    */
   static async fetchSharedVaultUsers(userId: number): Promise<User[]> {
     if (__DEV__) {
       console.log('UserService - Fetching shared vault users for user ID:', userId);
       console.log('UserService - BASE_URL:', API_CONFIG.BASE_URL);
       console.log('UserService - Token preview:', (await this.getStoredToken())?.substring(0, 20) + '...');
     }

     try {
       const token = await this.getStoredToken();
       if (!token) {
         if (__DEV__) {
           console.error('UserService - No authentication token found');
         }
         throw new Error('No authentication token found');
       }

       // First, get the current user's vaults to find shared access
       const currentUser = await this.getCurrentUser();
       if (!currentUser) {
         throw new Error('Unable to get current user information');
       }

       // Get current user's vault memberships
       const vaultsUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VAULT_MEMBERSHIPS.USER_VAULTS}`;

       if (__DEV__) {
         console.log('UserService - Fetching current user vaults from:', vaultsUrl);
       }

      const vaultsResponse = await fetch(vaultsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

       if (!vaultsResponse.ok) {
         throw new Error(`Failed to fetch user vaults: ${vaultsResponse.status}`);
       }

       const vaultsData = await vaultsResponse.json();
       const userVaults = vaultsData.data || [];

       if (__DEV__) {
         console.log('UserService - Current user vaults:', userVaults.length);
       }

       // Collect all users from shared vaults (excluding current user)
       const sharedUsersMap = new Map<number, User>();

       for (const vaultMembership of userVaults) {
         const vaultId = vaultMembership.vault_id;

         if (__DEV__) {
           console.log('UserService - Fetching members for vault ID:', vaultId);
         }

         const membersUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.VAULT_MEMBERS(vaultId)}`;

         const membersResponse = await fetch(membersUrl, {
           method: 'GET',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
           },
         });

         if (membersResponse.ok) {
           const membersData: VaultMembersResponse = await membersResponse.json();

           if (membersData.success && membersData.data) {
             for (const memberData of membersData.data) {
               // Skip the current user
               if (memberData.user_id !== currentUser.id) {
                 // Convert membership data to User format
                 const user: User = {
                   id: memberData.user_id,
                   firstName: memberData.first_name || undefined,
                   lastName: memberData.last_name || undefined,
                   username: memberData.username || undefined,
                   role: memberData.role === 'admin' ? 'admin' : 'user',
                   status: 'active', // Default status since not provided by API
                   lastAccess: memberData.created_at,
                   enabled: true // Default enabled since not provided by API
                 };

                 sharedUsersMap.set(user.id, user);
               }
             }
           }
         }
       }

       const sharedUsers = Array.from(sharedUsersMap.values());

       if (__DEV__) {
         console.log('UserService - Successfully fetched shared vault users:', sharedUsers.length);
         console.log('UserService - Users sharing vault access:', sharedUsers.map(u => `${u.firstName || u.username || `User ${u.id}`}`));
       }

       return sharedUsers;

     } catch (error) {
       if (__DEV__) {
         console.error('UserService - Fetch shared vault users error:', error);

         // Type-safe error logging
         if (error instanceof Error) {
           console.error('UserService - Error type:', error.constructor.name);
           console.error('UserService - Error message:', error.message);
           console.error('UserService - Error stack:', error.stack);
         } else {
           console.error('UserService - Non-Error object thrown:', error);
         }

         // Log additional context for debugging
         console.error('UserService - BASE_URL being used:', API_CONFIG.BASE_URL);
         console.error('UserService - Target user ID:', userId);

         // Check if it's a network error
         if (error instanceof TypeError && 'message' in error && error.message.includes('fetch')) {
           console.error('UserService - This appears to be a network connectivity error');
           console.error('UserService - Possible causes:');
           console.error('UserService - 1. Server is not running');
           console.error('UserService - 2. Incorrect BASE_URL');
           console.error('UserService - 3. Network connectivity issues');
           console.error('UserService - 4. Firewall blocking the request');
         }
       }

       // Re-throw with more context if it's already a handled error
       if (error instanceof Error) {
         throw error;
       }

       // Handle network errors
       if (error instanceof TypeError && error.message.includes('fetch')) {
         console.warn('UserService - Network error detected, backend may be unavailable');
         console.warn('UserService - Returning empty array as fallback');
         // Return empty array instead of throwing error for better UX
         return [];
       }

       throw new Error('Network error occurred while fetching shared vault users');
     }
   }

  /**
   * @deprecated Use fetchSharedVaultUsers instead for vault-specific user fetching
   * Fetch all users from the backend
   * @returns Promise<User[]>
   * @throws Error with specific message based on API response
   */
  static async fetchUsers(): Promise<User[]> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.LIST}`;

    if (__DEV__) {
      console.log('UserService - Fetching users from:', url);
      console.log('UserService - BASE_URL:', API_CONFIG.BASE_URL);
    }

    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (__DEV__) {
        console.log('UserService - Making GET request to:', url);
        console.log('UserService - Request headers:', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        });
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (__DEV__) {
        console.log('UserService - Response status:', response.status);
        console.log('UserService - Response ok:', response.ok);
      }

      if (!response.ok) {
        // Handle specific error cases based on status codes
        switch (response.status) {
          case 401:
            throw new Error('Authentication required to fetch users');
          case 403:
            throw new Error('Insufficient permissions to view users');
          case 500:
            throw new Error('Server error occurred while fetching users');
          default:
            const errorText = await response.text();
            throw new Error(`Failed to fetch users: ${errorText}`);
        }
      }

      const users: User[] = await response.json();

      if (__DEV__) {
        console.log('UserService - Successfully fetched users:', users.length);
      }

      return users;

    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Fetch users error:', error);

        // Type-safe error logging
        if (error instanceof Error) {
          console.error('UserService - Error type:', error.constructor.name);
          console.error('UserService - Error message:', error.message);
          console.error('UserService - Error stack:', error.stack);
        } else {
          console.error('UserService - Non-Error object thrown:', error);
        }

        // Log additional context for debugging
        console.error('UserService - BASE_URL being used:', API_CONFIG.BASE_URL);
        console.error('UserService - Full users URL:', url);

        // Check if it's a network error
        if (error instanceof TypeError && 'message' in error && error.message.includes('fetch')) {
          console.error('UserService - This appears to be a network connectivity error');
          console.error('UserService - Possible causes:');
          console.error('UserService - 1. Server is not running');
          console.error('UserService - 2. Incorrect BASE_URL');
          console.error('UserService - 3. Network connectivity issues');
          console.error('UserService - 4. Firewall blocking the request');
        }
      }

      // Re-throw with more context if it's already a handled error
      if (error instanceof Error) {
        throw error;
      }

      // Handle network errors
      throw new Error('Network error occurred while fetching users');
    }
  }

  /**
   * Get stored authentication token
   * @returns Promise<string | null>
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Error getting stored token:', error);
      }
      return null;
    }
  }

  /**
   * Store authentication token
   * @param token - JWT token to store
   * @returns Promise<void>
   */
  static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('access_token', token);
      if (__DEV__) {
        console.log('UserService - Token stored successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Error storing token:', error);
      }
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Clear stored authentication token
   * @returns Promise<void>
   */
  static async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('access_token');
      if (__DEV__) {
        console.log('UserService - Token cleared successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Error clearing token:', error);
      }
    }
  }

  /**
   * Validate email format
   * @param email - Email string to validate
   * @returns boolean
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param password - Password string to validate
   * @returns boolean
   */
  static isValidPassword(password: string): boolean {
    // At least 12 characters (matching backend validation)
    return password.length >= 12;
  }

  /**
   * Get current user information from token
   * @returns Promise<User | null>
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        if (__DEV__) {
          console.log('UserService - No stored token found for getCurrentUser');
        }
        return null;
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.ME}`;

      if (__DEV__) {
        console.log('UserService - Fetching current user from:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (__DEV__) {
        console.log('UserService - getCurrentUser response status:', response.status);
        console.log('UserService - getCurrentUser response ok:', response.ok);
      }

      if (!response.ok) {
        if (response.status === 401) {
          if (__DEV__) {
            console.log('UserService - Token expired or invalid, clearing stored token');
          }
          await this.clearToken();
          return null;
        }
        throw new Error(`Failed to get current user: ${response.status}`);
      }

      const userData: User = await response.json();

      if (__DEV__) {
        console.log('UserService - Successfully fetched current user:', userData);
      }

      return userData;
    } catch (error) {
      if (__DEV__) {
        console.error('UserService - Error getting current user:', error);
      }

      // If network error or server unreachable, don't clear token
      if (error instanceof Error && error.message.includes('fetch')) {
        return null;
      }

      // For other errors, clear token as it might be invalid
      await this.clearToken();
      return null;
    }
  }
}