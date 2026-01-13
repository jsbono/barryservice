import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'mechanic' | 'admin' | 'manager';
  shopId: string;
  shopName: string;
  avatar?: string;
  hourlyRate?: number;
  specializations?: string[];
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  shopCode: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new mechanic account
   */
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Get the currently authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string; expiresAt: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Request a password reset email
   */
  requestPasswordReset: async (data: PasswordResetRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset: async (data: PasswordResetConfirm): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar'>>): Promise<User> => {
    const response = await api.patch<User>('/auth/profile', data);
    return response.data;
  },

  /**
   * Change the current user's password
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  /**
   * Validate a shop code during registration
   */
  validateShopCode: async (shopCode: string): Promise<{ valid: boolean; shopName?: string }> => {
    const response = await api.get('/auth/validate-shop-code', { params: { code: shopCode } });
    return response.data;
  },
};

export default authService;
