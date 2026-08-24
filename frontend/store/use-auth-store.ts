import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
