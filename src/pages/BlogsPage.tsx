import React, { useEffect, useState } from 'react';
import { Book, Heart, MessageCircle, BookmarkCheck, User, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  readTime: number;
  likes: number;
  comments: number;
}

const sampleBlogs: BlogPost[] = [
  {
    id: '1',
    title: 'El arte contemporáneo en Latinoamérica',
    excerpt: 'Un análisis de las tendencias actuales y su impacto en la sociedad...',
    coverImage: 'https://images.pexels.com/photos/1749/fire-orange-emergency-burning.jpg?auto=compress&cs=tinysrgb&w=600',
    authorId: '1',
    authorName: 'María González',
    authorAvatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100',
    published: '2025-03-15T10:00:00Z',
    category: 'Arte',
    readTime: 8,
    likes: 42,
    comments: 7
  },
  {
    id: '2',
    title: 'Música tradicional: Preservación y evolución',
    excerpt: 'Explorando cómo las raíces musicales se mantienen relevantes en la era digital...',
    coverImage: 'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=600',
    authorId: '2',
    authorName: 'Carlos Moreno',
    authorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    published: '2025-03-10T14:30:00Z',
    category: 'Música',
    readTime: 6,
    likes: 38,
    comments: 12
  },
  {
    id: '3',
    title: 'El cine independiente: Voces emergentes',
    excerpt: 'Nuevos directores y perspectivas que están transformando la narrativa visual...',
    coverImage: 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=600',
    authorId: '3',
    authorName: 'Laura Díaz',
    authorAvatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100',
    published: '2025-03-05T09:15:00Z',
    category: 'Cine',
    readTime: 10,
    likes: 56,
    comments: 8
  }
];

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  useEffect(() => {
    // Simular carga de blogs
    const loadBlogs = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBlogs(sampleBlogs);
      setIsLoading(false);
    };
    
    loadBlogs();
  }, []);
  
  const categories = ['Todos', 'Arte', 'Música', 'Cine', 'Danza', 'Literatura'];
  
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
            <Link key={blog.id} to={`/blogs/${blog.id}`}>
              <motion.div 
                className="card p-0 overflow-hidden"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
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
                      <span className="mx-2">•</span>
                      <span>{blog.readTime} min de lectura</span>
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
                      
                      <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          <span>{blog.likes}</span>
                        </div>
                        <div className="flex items-center text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span>{blog.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
      </div>
      
      {/* Create Blog Button */}
      <div className="fixed bottom-20 right-4">
        <Link to="/blogs/new">
          <motion.button
            className="btn btn-primary rounded-full p-3 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book className="h-5 w-5" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default BlogsPage;