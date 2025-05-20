import { create } from 'zustand';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';

// Types
export type PostType = 'text' | 'image' | 'video' | 'audio' | 'document';

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
  isFavorite: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  
  fetchPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  toggleLike: (postId: string, userId: string) => void;
  addComment: (postId: string, userId: string, content: string) => void;
  toggleFavorite: (postId: string) => void;
  getFavoritePosts: () => Post[];
}

// Mock user data for posts
const MOCK_USERS = [
  {
    id: '1',
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  {
    id: '2',
    username: 'janedoe',
    displayName: 'Jane Doe',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  {
    id: '3',
    username: 'marksmith',
    displayName: 'Mark Smith',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
  }
];

// Sample posts for the demo
const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    userId: '2',
    type: 'image',
    content: 'Enjoying a beautiful day at the art gallery! #art #inspiration',
    mediaUrl: 'https://images.pexels.com/photos/3004909/pexels-photo-3004909.jpeg?auto=compress&cs=tinysrgb&w=600',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    likes: ['3'],
    comments: [
      {
        id: '101',
        userId: '3',
        content: 'Looks amazing! Which gallery is this?',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      }
    ],
    isFavorite: false
  },
  {
    id: '2',
    userId: '3',
    type: 'text',
    content: 'Just released a new album! So excited to share this journey with all of you. Link in bio to listen now. #music #newrelease',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    likes: ['1', '2'],
    comments: [],
    isFavorite: true
  },
  {
    id: '3',
    userId: '1',
    type: 'image',
    content: 'Working on a new painting technique. What do you think? #art #workinprogress',
    mediaUrl: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=600',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    likes: [],
    comments: [
      {
        id: '102',
        userId: '2',
        content: 'Love the colors! What materials are you using?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString() // 7 hours ago
      }
    ],
    isFavorite: false
  }
];

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  
  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('publicaciones')
        .select(`*, autor:usuarios(*), comentarios(*), reacciones(*)`)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      // Mapear los datos de Supabase al tipo Post
      const posts: Post[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.autor_id || '',
        type: p.tipo as PostType,
        content: p.contenido || '',
        mediaUrl: Array.isArray(p.multimedia_url) ? p.multimedia_url[0] : undefined,
        createdAt: p.creado_en || '',
        likes: (p.reacciones || []).map((r: any) => r.usuario_id),
        comments: (p.comentarios || []).map((c: any) => ({
          id: c.id,
          userId: c.usuario_id,
          content: c.contenido,
          createdAt: c.creado_en
        })),
        isFavorite: false // Puedes ajustar esto según tu lógica de favoritos
      }));
      set({ posts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        isLoading: false
      });
    }
  },
  
  addPost: async (post) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost: Post = {
        ...post,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        isFavorite: false
      };
      
      set(state => ({ 
        posts: [newPost, ...state.posts],
        isLoading: false 
      }));
      
      toast.success('Post created successfully!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create post', 
        isLoading: false 
      });
      toast.error('Failed to create post');
    }
  },
  
  toggleLike: (postId, userId) => {
    set(state => {
      const updatedPosts = state.posts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(userId);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(id => id !== userId)
              : [...post.likes, userId]
          };
        }
        return post;
      });
      
      return { posts: updatedPosts };
    });
  },
  
  addComment: (postId, userId, content) => {
    if (!content.trim()) return;
    
    set(state => {
      const updatedPosts = state.posts.map(post => {
        if (post.id === postId) {
          const newComment: Comment = {
            id: Math.random().toString(36).substring(2, 9),
            userId,
            content,
            createdAt: new Date().toISOString()
          };
          
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      });
      
      return { posts: updatedPosts };
    });
    
    toast.success('Comment added');
  },
  
  toggleFavorite: (postId) => {
    set(state => {
      const updatedPosts = state.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isFavorite: !post.isFavorite
          };
        }
        return post;
      });
      
      return { posts: updatedPosts };
    });
  },
  
  getFavoritePosts: () => {
    return get().posts.filter(post => post.isFavorite);
  }
}));

// Helper function to get user by ID
export const getUserById = (userId: string) => {
  return MOCK_USERS.find(user => user.id === userId);
};

// Helper function to format post date
export const formatPostDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};