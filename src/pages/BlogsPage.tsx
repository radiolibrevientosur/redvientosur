import React, { useEffect, useState } from 'react';
import { Book, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  published: string;
  category: string;
  commentsCount?: number;
  likesCount?: number;
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      // Traer solo publicaciones tipo 'blog'
      const { data, error } = await supabase
        .from('publicaciones')
        .select(`id, titulo, excerpt, imagen_portada, categoria, publicado_en, autor:usuarios(id, nombre_completo, avatar_url)`)
        .eq('tipo', 'blog')
        .order('publicado_en', { ascending: false });
      if (error) {
        setBlogs([]);
        setIsLoading(false);
        return;
      }
      // Para cada blog, obtener comentarios y likes
      const blogsWithExtras = await Promise.all((data || []).map(async (b: any) => {
        // Comentarios
        const { count: commentsCount } = await supabase
          .from('comentarios_blog')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', b.id);
        // Likes
        const { count: likesCount } = await supabase
          .from('reacciones_blog')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', b.id)
          .eq('tipo', 'like');
        // Favorito (puedes agregar lógica para el usuario actual si lo necesitas)
        return {
          id: b.id,
          title: b.titulo,
          excerpt: b.excerpt,
          coverImage: b.imagen_portada,
          authorId: b.autor?.id || '',
          authorName: b.autor?.nombre_completo || 'Autor',
          authorAvatar: b.autor?.avatar_url || '',
          published: b.publicado_en,
          category: b.categoria || 'General',
          commentsCount: commentsCount || 0,
          likesCount: likesCount || 0
        };
      }));
      setBlogs(blogsWithExtras);
      setIsLoading(false);
    };
    fetchBlogs();
  }, []);

  const categories = ['Todos', 'Arte', 'Música', 'Cine', 'Danza', 'Literatura'];

  const handleShowComments = async (blogId: string) => {
    if (comments[blogId]) {
      setExpandedBlogId(expandedBlogId === blogId ? null : blogId);
      return;
    }
    setLoadingComments(blogId);
    const { data, error } = await supabase
      .from('comentarios_blog')
      .select('id, contenido, creado_en, autor:usuarios(id, nombre_completo, avatar_url)')
      .eq('publicacion_id', blogId)
      .order('creado_en', { ascending: true });
    setComments(prev => ({ ...prev, [blogId]: data || [] }));
    setExpandedBlogId(blogId);
    setLoadingComments(null);
  };

  const handleAddComment = async (blogId: string) => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comentarios_blog')
        .insert({
          publicacion_id: blogId,
          autor_id: user.id,
          contenido: newComment.trim()
        })
        .select('id, contenido, creado_en, autor:usuarios(id, nombre_completo, avatar_url)')
        .single();
      if (error) throw error;
      setComments(prev => ({
        ...prev,
        [blogId]: prev[blogId] ? [...prev[blogId], data] : [data]
      }));
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (err) {
      toast.error('Error al agregar comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Cargando artículos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Blog */}
      <div className="relative rounded-xl overflow-hidden h-48 mb-6">
        <img 
          src="https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?auto=compress&cs=tinysrgb&w=600"
          alt="Featured blog" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <span className="text-xs font-medium text-primary-300 mb-1">DESTACADO</span>
          <h2 className="text-xl font-bold text-white mb-1">Festivales culturales: Espacios de integración</h2>
          <p className="text-sm text-gray-200">Cómo los eventos masivos están redefiniendo el acceso a la cultura</p>
          <Link to="/blogs/featured" className="mt-2 text-sm text-white flex items-center">
            Leer más <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {categories.map(category => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                activeCategory === category 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Blog List */}
      <div className="space-y-4">
        {blogs
          .filter(blog => activeCategory === 'Todos' || blog.category === activeCategory)
          .map(blog => (
            <div key={blog.id} className="card p-4">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 aspect-video md:aspect-square">
                  <img 
                    src={blog.coverImage} 
                    alt={blog.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 md:w-2/3">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      {blog.category}
                    </span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(blog.published).toLocaleDateString('es-ES')}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="avatar h-6 w-6 mr-2">
                        <img 
                          src={blog.authorAvatar} 
                          alt={blog.authorName} 
                          className="avatar-img"
                        />
                      </div>
                      <span className="text-xs font-medium">{blog.authorName}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-8 18v-4m8 4v-4m-8 0H3m18 0h-3" />
                        </svg>
                        {blog.commentsCount || 0}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" />
                        </svg>
                        {blog.likesCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      className="text-primary-600 underline text-sm"
                      onClick={() => handleShowComments(blog.id)}
                    >
                      {expandedBlogId === blog.id ? 'Ocultar comentarios' : `Ver comentarios (${blog.commentsCount})`}
                    </button>
                    <span className="text-gray-500 text-xs">❤️ {blog.likesCount}</span>
                  </div>
                  {expandedBlogId === blog.id && (
                    <div className="mt-3 border-t pt-3">
                      {loadingComments === blog.id ? (
                        <div className="text-sm text-gray-500">Cargando comentarios...</div>
                      ) : comments[blog.id]?.length === 0 ? (
                        <div className="text-sm text-gray-400">Sin comentarios aún.</div>
                      ) : (
                        <ul className="space-y-2">
                          {comments[blog.id].map((c: any) => (
                            <li key={c.id} className="flex gap-2 items-start">
                              <img src={c.autor?.avatar_url || '/default-avatar.png'} alt={c.autor?.nombre_completo || 'Usuario'} className="w-8 h-8 rounded-full" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{c.autor?.nombre_completo || 'Usuario'}</span>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{c.contenido}</p>
                                <span className="text-xs text-gray-400">{new Date(c.creado_en).toLocaleString('es-ES')}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {user && (
                        <form
                          className="flex gap-2 items-center mt-4"
                          onSubmit={e => {
                            e.preventDefault();
                            handleAddComment(blog.id);
                          }}
                        >
                          <img src={user.avatar} alt={user.displayName} className="w-8 h-8 rounded-full" />
                          <input
                            type="text"
                            className="flex-1 input"
                            placeholder="Escribe un comentario..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                            maxLength={300}
                          />
                          <button
                            type="submit"
                            className="btn btn-primary px-4 py-2"
                            disabled={isSubmitting || !newComment.trim()}
                          >
                            {isSubmitting ? 'Enviando...' : 'Comentar'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
      
      {/* Create Blog Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Link to="/blogs/new">
          <motion.button
            className="btn btn-primary rounded-full p-3 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Crear nuevo blog"
          >
            <Book className="h-5 w-5" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default BlogsPage;