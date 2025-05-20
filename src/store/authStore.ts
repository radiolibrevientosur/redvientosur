import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      const userData = data.user;
      if (!userData) throw new Error('No user data returned');
      // Mapear los datos personalizados desde user_metadata
      const mappedUser: User = {
        id: userData.id,
        email: userData.email ?? '',
        username: userData.user_metadata?.username,
        displayName: userData.user_metadata?.displayName,
        avatar: userData.user_metadata?.avatar
      };
      localStorage.setItem('user', JSON.stringify(mappedUser));
      set({ isAuthenticated: true, user: mappedUser, isLoading: false });
      toast.success('¡Inicio de sesión exitoso!');
    } catch (error) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  },
  
  register: async (email: string, password: string, username: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, displayName }
        }
      });
      if (error) throw error;
      // Si el usuario está confirmado, hacer login automático
      if (data.user && data.user.aud === 'authenticated' && !data.user.confirmed_at) {
        toast.success('¡Registro exitoso! Revisa tu correo para verificar tu cuenta antes de iniciar sesión.');
        set({ isAuthenticated: false, user: null, isLoading: false });
      } else {
        // Intentar login automático
        await useAuthStore.getState().login(email, password);
      }
    } catch (error) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('user');
    set({ isAuthenticated: false, user: null });
    toast.info('You have been logged out');
  },
  
  checkAuth: () => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        set({ isAuthenticated: true, user, isLoading: false });
      } catch (e) {
        localStorage.removeItem('user');
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));