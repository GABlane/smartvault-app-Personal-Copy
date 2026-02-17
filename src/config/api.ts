import { ENV_CONFIG } from './env';
import { APP_CONSTANTS } from './constants';
import { log } from '../utils/logger';

// --- API Configuration ---
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.BASE_URL,
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      SIGNUP: '/api/v1/auth/signup',
      REFRESH: '/api/v1/auth/refresh',
      LOGOUT: '/api/v1/auth/logout',
      REQUEST_OTP: '/api/v1/auth/request-otp',
      VERIFY_OTP: '/api/v1/auth/verify-otp',
      REQUEST_PASSWORD_RESET: '/api/v1/auth/request-password-reset',
      CONFIRM_PASSWORD_RESET: '/api/v1/auth/confirm-password-reset',
    },
    USERS: {
      CREATE: '/api/v1/users',
      ME: '/api/v1/users/me',
      LIST: '/users/',
      REMOVE_FROM_VAULT: (vaultId: number, userId: number) => `/vault-memberships/${userId}/vault/${vaultId}`,
      VAULT_MEMBERS: (vaultId: number) => `/vault-memberships/vault/${vaultId}`,
      // Legacy aliases — these screens need rewriting for the new OTP-based auth flow
      LOGIN: '/api/v1/auth/login',
      REGISTER: '/api/v1/auth/signup',
      VERIFY_EMAIL: '/api/v1/auth/verify-otp',
      RESEND_VERIFICATION: '/api/v1/auth/request-otp',
      SEND_VERIFICATION: '/api/v1/auth/request-otp',
      VERIFICATION_STATUS: '/api/v1/auth/verify-otp',
      REQUEST_PASSWORD_RESET: '/api/v1/auth/request-password-reset',
      VALIDATE_RESET_TOKEN: '/api/v1/auth/confirm-password-reset',
      RESET_PASSWORD: '/api/v1/auth/confirm-password-reset',
    },
    LOGS: {
      FILTERED: (vaultId: number) => `/logs/vault/${vaultId}/filtered`,
      WS: '/logs/ws',
    },
    VAULT_MEMBERSHIPS: {
      USER_VAULTS: '/vault-memberships/user/vaults',
      ADMIN_CHECK: (vaultId: number) => `/vault-memberships/vaults/${vaultId}/admin-check`,
    },
    VAULT_INVITATIONS: {
      CREATE: '/vault-invitations/',
      VALIDATE: (code: string) => `/vault-invitations/${code}`,
      ACCEPT: (code: string) => `/vault-invitations/${code}/accept`,
      BY_VAULT: (vaultId: number) => `/vault-invitations/vault/${vaultId}`,
    },
    VAULTS: {
      CREATE: '/vaults/',
      LIST: '/vaults/',
      BY_ID: (id: string) => `/vaults/${id}`,
      TRANSFER_INITIATE: (vaultId: number) => `/vaults/${vaultId}/transfer/initiate`,
      TRANSFER_ACCEPT: (vaultId: number) => `/vaults/${vaultId}/transfer/accept`,
    },
  },
  
  DEFAULTS: {
    VAULT_ID: ENV_CONFIG.DEFAULT_VAULT_ID,
    PREFIXES: ENV_CONFIG.DEFAULT_PREFIXES,
    LOG_LIMIT: APP_CONSTANTS.DEFAULTS.LOG_LIMIT,
    LOG_OFFSET: APP_CONSTANTS.DEFAULTS.LOG_OFFSET,
  },
  
  STORAGE_KEYS: APP_CONSTANTS.STORAGE_KEYS,
} as const;

// WebSocket URL construction
const wsProtocol = API_CONFIG.BASE_URL.startsWith('https') ? 'wss://' : 'ws://';
const wsHost = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '');
export const EVENT_WS_URL = ENV_CONFIG.EVENT_WS_URL || `${wsProtocol}${wsHost}${API_CONFIG.ENDPOINTS.LOGS.WS}`;

// Development logging
if (__DEV__) {
  log.debug('Config', 'API Configuration loaded', {
    BASE_URL: API_CONFIG.BASE_URL,
    DEFAULT_VAULT_ID: API_CONFIG.DEFAULTS.VAULT_ID,
    DEFAULT_PREFIXES: API_CONFIG.DEFAULTS.PREFIXES,
    WS_URL: EVENT_WS_URL,
  });
}
