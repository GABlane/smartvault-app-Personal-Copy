import { UserService } from './UserService';
import { API_CONFIG } from '../config/api';
import { ApiService } from './ApiService';
import { ApiError } from './ApiService';
import { VaultMembersResponse } from '../types/UserTypes';
import { AccessLimits, AccessLimitsResponse } from '../types/AccessLimits';
import { ActivityLog } from '../types/ActivityTypes';

export interface VaultMembership {
  vault_id: string | number;
  vault_name?: string | null;
  vault_device_id?: string | null;
  vault_location?: string | null;
  role: 'admin' | 'member' | 'guest';
  created_at: string;
  last_accessed_at?: string | null; // Timestamp of user's last successful access to this vault
}

export interface VaultCreateData {
  vault_name: string;
  hardware_uuid?: string;
}

export interface VaultCreationResult {
  vault_id: string;
  hardware_uuid: string;
  vault_name: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  detail?: string;
}

export type TransferType = 'full_transfer' | 'shared_access';

export interface TransferInitiateRequest {
  new_owner_user_id: number;
  transfer_type: TransferType;
}

export interface TransferInitiateResponse {
  success: boolean;
  data?: {
    invitation_code: string;
    expires_at: string;
    vault_id: number;
    new_owner_user_id: number;
    transfer_type: string;
  };
  detail: string;
}

/** Shape of a single entry returned by GET /api/v1/vaults/{id}/activity */
export interface ActivityLogEntry {
  id: string;
  vault_id: string;
  user_id: string | null;
  action: string;
  method: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export class VaultService {
  private static getBaseUrl(): string {
    return API_CONFIG.BASE_URL;
  }

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await UserService.getStoredToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getUserVaults(token?: string): Promise<VaultMembership[]> {
    try {
      console.log('VaultService: Making API call to vault list endpoint');
      const data = await ApiService.get<VaultMembersResponse>(API_CONFIG.ENDPOINTS.VAULTS.LIST, token);
      console.log('VaultService: Raw API response:', data);

      if (!Array.isArray(data) && !data.success) {
        console.error('VaultService: API call failed:', data);
        throw new Error(data.detail || 'Failed to load accessible vaults');
      }

      console.log('VaultService: API call successful, processing data...');

      const vaultItems = Array.isArray(data) ? data : data.data;
      const transformedData = (vaultItems || []).map(item => ({
        vault_id: item.vault_id ?? item.id,
        vault_name: item.vault_name ?? item.name ?? null,
        vault_device_id: item.vault_device_id ?? item.device_id ?? null,
        vault_location: item.vault_location ?? item.location ?? null,
        role: (item.role as 'admin' | 'member' | 'guest') || 'member',
        created_at: item.created_at || new Date().toISOString(),
        last_accessed_at: item.last_access || item.last_accessed_at || null
      }));

      console.log('VaultService - API Response:', Array.isArray(data) ? data : data.data);
      console.log('VaultService - Transformed Data:', transformedData);

      return transformedData;
    } catch (error) {
      console.error('VaultService: Error loading user vaults:', error);
      console.error('VaultService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error: ${String(error)}`);
    }
  }

  static async checkAdminAccess(vaultId: number, token?: string): Promise<boolean> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const membersResponse = await ApiService.get<VaultMembersResponse>(
        API_CONFIG.ENDPOINTS.VAULTS.MEMBERS(vaultId),
        token
      );

      const members = Array.isArray(membersResponse)
        ? membersResponse
        : (membersResponse.data || []);
      const member = members.find(m => m.user_id === currentUser.id);
      return member?.role === 'admin';
    } catch (error) {
      console.error('Admin check error:', error);
      throw error;
    }
  }

  /**
   * Get admin vaults only
   */
  static getAdminVaults(vaults: VaultMembership[]): VaultMembership[] {
    return vaults.filter(v => v.role === 'admin');
  }

  /**
   * Get member vaults only
   */
  static getMemberVaults(vaults: VaultMembership[]): VaultMembership[] {
    return vaults.filter(v => v.role === 'member');
  }

  /**
   * Get access limits for a specific vault
   */
  static async getAccessLimits(
    vaultId: number,
    token?: string
  ): Promise<AccessLimits> {
    try {
      console.log('🔍 VaultService: Fetching access limits for vault', vaultId);
      const response = await ApiService.get<AccessLimitsResponse>(
        `/api/v1/vaults/${vaultId}/access-limits`,
        token
      );

      if (!response.success) {
        throw new Error(response.detail || 'Failed to fetch access limits');
      }

      console.log('✅ VaultService: Access limits fetched successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ VaultService: Error fetching access limits:', error);
      throw error;
    }
  }

  /**
   * Create a new vault
   */
  static async createVault(
    vaultData: VaultCreateData,
    token?: string
  ): Promise<VaultCreationResult> {
    try {
      console.log('VaultService: Creating vault with data:', vaultData);

      const response = await ApiService.post<VaultCreationResult>(
        API_CONFIG.ENDPOINTS.VAULTS.PROVISION,
        vaultData,
        token
      );

      console.log('VaultService: Vault created successfully:', response);
      return response;
    } catch (error) {
      console.error('VaultService: Error creating vault:', error);
      throw error;
    }
  }

  /**
   * Initiate vault ownership transfer
   */
  static async initiateOwnershipTransfer(
    vaultId: number,
    newOwnerUserId: number,
    transferType: TransferType,
    token?: string
  ): Promise<TransferInitiateResponse> {
    try {
      console.log('🔍 VaultService: Initiating ownership transfer', {
        vaultId,
        newOwnerUserId,
        transferType
      });

      const requestData: TransferInitiateRequest = {
        new_owner_user_id: newOwnerUserId,
        transfer_type: transferType,
      };

      const response = await ApiService.post<TransferInitiateResponse>(
        API_CONFIG.ENDPOINTS.VAULTS.TRANSFER_INITIATE(vaultId),
        requestData,
        token
      );

      console.log('✅ VaultService: Ownership transfer initiated successfully');
      return response;
    } catch (error) {
      console.error('❌ VaultService: Error initiating ownership transfer:', error);
      throw error;
    }
  }

  /**
   * Accept vault ownership transfer
   */
  static async acceptOwnershipTransfer(
    vaultId: number,
    invitationCode: string,
    token?: string
  ): Promise<ApiResponse<{
    vault_id: number;
    new_owner_user_id: number;
    transfer_type: string;
    accepted_at: string;
  }>> {
    try {
      console.log('🔍 VaultService: Accepting ownership transfer', {
        vaultId,
        invitationCode
      });

      const requestData = {
        invite_code: invitationCode,
      };

      const response = await ApiService.post<ApiResponse<{
        vault_id: number;
        new_owner_user_id: number;
        transfer_type: string;
        accepted_at: string;
      }>>(
        API_CONFIG.ENDPOINTS.VAULTS.TRANSFER_ACCEPT(vaultId),
        requestData,
        token
      );

      if (!response.success) {
        throw new Error(response.detail || 'Failed to accept ownership transfer');
      }

      console.log('✅ VaultService: Ownership transfer accepted successfully');
      return response;
    } catch (error) {
      console.error('❌ VaultService: Error accepting ownership transfer:', error);
      throw error;
    }
  }

  /**
   * Accept vault ownership transfer with optional vault property updates
   */
  static async acceptOwnershipTransferWithProperties(
    vaultId: number,
    transferData: {
      invite_code: string;
      device_id?: string;
      name?: string;
      location?: string;
      status?: 'locked' | 'unlocked' | 'tampered';
    },
    token?: string
  ): Promise<ApiResponse<{
    vault_id: number;
    new_owner_user_id: number;
    vault_properties_updated: string[];
    accepted_at: string;
  }>> {
    try {
      console.log('🔍 VaultService: Accepting ownership transfer with properties', {
        vaultId,
        transferData
      });

      const response = await ApiService.post<ApiResponse<{
        vault_id: number;
        new_owner_user_id: number;
        vault_properties_updated: string[];
        accepted_at: string;
      }>>(
        API_CONFIG.ENDPOINTS.VAULTS.TRANSFER_ACCEPT(vaultId),
        transferData,
        token
      );

      if (!response.success) {
        throw new Error(response.detail || 'Failed to accept ownership transfer');
      }

      console.log('✅ VaultService: Ownership transfer accepted with properties successfully');
      return response;
    } catch (error) {
      console.error('❌ VaultService: Error accepting ownership transfer with properties:', error);
      throw error;
    }
  }

  /**
   * Unlock a vault using a PIN.
   * POST /api/v1/vaults/{vault_id}/unlock/pin
   */
  static async unlockWithPin(
    vaultId: string,
    pin: string
  ): Promise<{ result: string; attempts_remaining: number }> {
    try {
      console.log('VaultService: unlockWithPin called for vault', vaultId);
      const response = await ApiService.post<{
        vault_id: string;
        result: string;
        attempts_remaining: number;
      }>(
        API_CONFIG.ENDPOINTS.VAULTS.PIN_UNLOCK(vaultId),
        { pin }
      );
      console.log('VaultService: unlockWithPin response:', response);
      return { result: response.result, attempts_remaining: response.attempts_remaining };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) throw new Error('Wrong PIN. ' + (error.message || 'Please try again.'));
        if (error.status === 423) throw new Error('Vault is locked out due to too many failed attempts.');
        if (error.status === 409) throw new Error('No PIN has been set for this vault.');
        if (error.status === 403) throw new Error('You do not have access to this vault.');
        if (error.status === 404) throw new Error('Vault not found.');
      }
      console.error('VaultService: unlockWithPin error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Send a remote unlock command to a vault (WebSocket-based).
   * POST /api/v1/vaults/{vault_id}/unlock
   */
  static async sendUnlockCommand(
    vaultId: string
  ): Promise<{ sent: boolean; command_id: string }> {
    try {
      console.log('VaultService: sendUnlockCommand called for vault', vaultId);
      const response = await ApiService.post<{
        command_id: string;
        vault_id: string;
        expires_at: string;
        sent: boolean;
      }>(
        API_CONFIG.ENDPOINTS.VAULTS.UNLOCK(vaultId),
        {}
      );
      console.log('VaultService: sendUnlockCommand response:', response);
      return { sent: response.sent, command_id: response.command_id };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 503) throw new Error('Vault is offline and cannot receive unlock commands.');
        if (error.status === 403) throw new Error('You do not have access to this vault.');
        if (error.status === 404) throw new Error('Vault not found.');
      }
      console.error('VaultService: sendUnlockCommand error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Get activity log entries for a vault.
   * GET /api/v1/vaults/{vault_id}/activity?limit={limit}
   */
  static async getVaultActivity(vaultId: string, limit: number = 20): Promise<ActivityLogEntry[]> {
    try {
      console.log('VaultService: getVaultActivity called for vault', vaultId, 'limit', limit);
      const response = await ApiService.get<{
        vault_id: string;
        entries: ActivityLogEntry[];
        count: number;
      }>(
        `${API_CONFIG.ENDPOINTS.VAULTS.ACTIVITY(vaultId)}?limit=${limit}`
      );
      console.log('VaultService: getVaultActivity received', response?.entries?.length ?? 0, 'entries');
      return response?.entries ?? [];
    } catch (error) {
      console.error('VaultService: getVaultActivity error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Validate ownership transfer invitation code
   */
  static async validateOwnershipTransfer(
    invitationCode: string
  ): Promise<{
    valid: boolean;
    reason?: string;
    vault_id?: number;
    transfer_type?: string;
    expires_at?: string;
  }> {
    try {
      console.log('🔍 VaultService: Validating ownership transfer code');

      const response = await ApiService.getPublic<ApiResponse<{
        valid: boolean;
        vault_id?: number;
        transfer_type?: string;
        expires_at?: string;
        vault_name?: string;
      }>>(
        API_CONFIG.ENDPOINTS.VAULTS.TRANSFER_VALIDATE(invitationCode)
      );

      if (response.success && response.data.valid) {
        return {
          valid: true,
          vault_id: response.data.vault_id,
          transfer_type: response.data.transfer_type,
          expires_at: response.data.expires_at,
        };
      } else {
        return {
          valid: false,
          reason: response.detail || 'Invalid transfer code',
        };
      }
    } catch (error) {
      console.error('❌ VaultService: Error validating transfer code:', error);
      return {
        valid: false,
        reason: 'Network error occurred',
      };
    }
  }
}

// ─── Activity Log Transform ───────────────────────────────────────────────────

/**
 * Transform a backend ActivityLogEntry into the frontend ActivityLog shape.
 * Backend action values (from access_log.py):
 *   VAULT_UNLOCKED, VAULT_UNLOCK_FAILED, VAULT_STATE_CHANGED,
 *   UNLOCK_COMMAND_SENT, PIN_SET, MEMBER_ADDED, MEMBER_REMOVED
 * Backend method values: PIN, BIOMETRIC, COMMAND, SYSTEM
 */
export function transformActivity(entry: ActivityLogEntry): ActivityLog {
  type MappedAction = {
    title: string;
    eventType: ActivityLog['eventType'];
    status: ActivityLog['status'];
  };

  const actionMap: Record<string, MappedAction> = {
    VAULT_UNLOCKED: { title: 'VAULT ACCESS', eventType: 'vault_unlock', status: 'success' },
    VAULT_UNLOCK_FAILED: { title: 'AUTH FAILURE', eventType: 'failed_unlock', status: 'failed' },
    VAULT_STATE_CHANGED: { title: 'STATE CHANGE', eventType: 'settings_updated', status: 'success' },
    UNLOCK_COMMAND_SENT: { title: 'REMOTE UNLOCK', eventType: 'remote_unlock', status: 'success' },
    PIN_SET: { title: 'PIN UPDATED', eventType: 'settings_updated', status: 'success' },
    MEMBER_ADDED: { title: 'MEMBER ADDED', eventType: 'user_added', status: 'success' },
    MEMBER_REMOVED: { title: 'MEMBER REMOVED', eventType: 'user_added', status: 'success' },
  };

  const mapped: MappedAction = actionMap[entry.action] ?? {
    title: (entry.action ?? 'EVENT').toUpperCase().replace(/_/g, ' '),
    eventType: 'settings_updated' as ActivityLog['eventType'],
    status: (entry.action?.toLowerCase().includes('fail') ? 'failed' : 'success') as ActivityLog['status'],
  };

  // Format relative timestamp
  const createdAt = new Date(entry.created_at);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const timestamp =
    diffMin < 1
      ? 'Just now'
      : diffMin < 60
        ? `${diffMin}m ago`
        : diffMin < 1440
          ? `${Math.floor(diffMin / 60)}h ago`
          : `${Math.floor(diffMin / 1440)}d ago`;

  // Build description from method + metadata
  const metaPart = entry.metadata ? JSON.stringify(entry.metadata) : null;
  const description =
    [entry.method, metaPart].filter(Boolean).join(' · ') || mapped.title;

  return {
    id: entry.id,
    status: mapped.status,
    eventType: mapped.eventType,
    title: mapped.title,
    description,
    timestamp,
    user: entry.user_id
      ? { initials: '??', name: `UID:${String(entry.user_id).slice(0, 8)}` }
      : { initials: 'SV', name: 'SMARTVAULT' },
  };
}
