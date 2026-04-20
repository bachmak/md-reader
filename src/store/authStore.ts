import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      const res = await fetch('/auth/me', { credentials: 'include' });
      const user = res.ok ? await res.json() : null;
      set({ user, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  signIn: () => {
    window.location.href = '/auth/google';
  },

  signOut: async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    set({ user: null });
    window.location.href = '/';
  },
}));
