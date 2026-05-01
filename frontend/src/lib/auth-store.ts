'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (username: string, password: string) => {
        try {
          const { data } = await api.post('/auth/login', { username, password });
          
          if (data.success) {
            localStorage.setItem('token', data.token);
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            set({ user: data.user, token, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      initAuth: async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          set({ isLoading: false });
          return;
        }
        
        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            set({ user: data.user, token: storedToken, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);