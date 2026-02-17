export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  lastAccess: string;
  enabled: boolean;
}

// Helper function to get display name
export const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username || `User ${user.id}`;
};

// Registration types
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface UserRegistrationResponse {
  success: boolean;
  data: User;
  detail: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

// OTP-based registration types
export interface OTPRequestPayload {
  email: string;
}

export interface OTPVerifyPayload {
  email: string;
  otp: string;
}

export interface OTPVerifyResponse {
  signup_ticket: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  signup_ticket: string;
  full_name?: string;
}

export interface UserLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface VaultMembershipResponse {
  id: number;
  user_id: number;
  vault_id: number;
  vault_name: string | null;
  vault_device_id: string | null;
  vault_location: string | null;
  role: 'admin' | 'member' | 'guest';
  created_at: string;
  updated_at: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  last_access: string | null; // Timestamp of user's last successful access to this vault
}

export interface VaultMembersResponse {
  success: boolean;
  data: VaultMembershipResponse[];
  detail?: string;
}

export interface UsersScreenNavigationProp {
  navigate: (screen: string, params?: { userId: string }) => void;
}

export interface UsersScreenProps {
  navigation?: UsersScreenNavigationProp;
}

export interface BadgeVariant {
  default: 'default';
  secondary: 'secondary';
}

export type BadgeVariantType = BadgeVariant[keyof BadgeVariant];

export interface BadgeProps {
  label: string;
  variant?: BadgeVariantType;
}

export interface UserItemProps {
  user: User;
  onToggleEnabled: (userId: string) => void;
  onRemoveUser: (userId: string) => void;
  onPress: (userId: string) => void;
}

export interface UserManagementHookReturn {
  users: User[];
  sortedUsers: User[];
  isLoading: boolean;
  error: string | null;
  toggleUserEnabled: (userId: string) => void;
  removeUser: (userId: string) => void;
  refreshUsers: () => Promise<void>;
}