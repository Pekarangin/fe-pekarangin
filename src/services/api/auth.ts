import { request } from './client';
import { tokenStorage } from './storage';

export interface AuthUserData {
  user_id: string;
  nama: string;
  email: string;
  token: string;
  avatar_url?: string | null;
  is_new_user?: boolean;
}

export interface UserProfile {
  user_id: string;
  nama: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
}

export const authService = {
  register: async (nama: string, email: string, password: string): Promise<AuthUserData> => {
    const data = await request<AuthUserData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nama, email, password }),
    });
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  login: async (email: string, password: string): Promise<AuthUserData> => {
    const data = await request<AuthUserData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  loginWithGoogle: async (id_token: string): Promise<AuthUserData> => {
    const data = await request<AuthUserData>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token }),
    });
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    return request<UserProfile>('/auth/me', {
      method: 'GET',
    });
  },

  logout: (): void => {
    tokenStorage.clear();
  },
};
