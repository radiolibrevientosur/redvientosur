import { create } from 'zustand';
import { toast } from 'sonner';

// Mock user data for demo
const MOCK_USERS = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'
  }
];

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
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
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user (In a real app, this would be an API call)
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const { password: _, ...userData } = user;
      
      // Save to localStorage (in real app, would save auth token)
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ isAuthenticated: true, user: userData, isLoading: false });
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  },
  
  register: async (email: string, password: string, username: string, displayName: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email === email)) {
        throw new Error('User already exists');
      }
      
      // Create new user (In a real app, this would be an API call)
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        password,
        username,
        displayName,
        avatar: `https://ui-avatars.com/api/?name=${displayName}&background=random`
      };
      
      // In real app, would push to database
      MOCK_USERS.push(newUser);
      
      const { password: _, ...userData } = newUser;
      
      // Save to localStorage (in real app, would save auth token)
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ isAuthenticated: true, user: userData, isLoading: false });
      toast.success('Successfully registered!');
    } catch (error) {
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