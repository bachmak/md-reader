import { create } from 'zustand';
import { initGoogleApis, createTokenClient } from '../lib/google';

interface AuthState {
  accessToken: string | null;
  ready: boolean;
  init: () => Promise<void>;
  signIn: () => void;
}

let _tokenClient: { requestAccessToken: () => void } | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  ready: false,

  init: async () => {
    await initGoogleApis();
    _tokenClient = createTokenClient(
      (token) => set({ accessToken: token }),
      () => set({ accessToken: null }),
    );
    set({ ready: true });
  },

  signIn: () => _tokenClient?.requestAccessToken(),
}));
