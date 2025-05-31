import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Heart, 
  MessageCircle, 
  Send,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { getUserById } from '../../store/postStore';
import { Link } from 'react-router-dom';

interface EventoCulturalCardProps {
  event: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    ubicacion: string;
    imagen_url?: string;
    categoria?: string; // <-- Hacer opcional
    tipo: string;
    userId?: string;
    metadata?: {
      target_audience?: string;
      responsible_person?: {
        name: string;
        phone: string;
        social_media?: string;
      };
      technical_requirements?: string[];
      tags?: string[];
    };
  };
  onEdit?: () => void;
  disableCardNavigation?: boolean;
  onDeleted?: () => void;
}

const EventoCulturalCard: React.FC<EventoCulturalCardProps> = ({ event, onEdit, disableCardNavigation, onDeleted }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const { user } = useAuthStore();
  const isCreator = user && event.userId && user.id === event.userId;
  const isLiked = user ? likes.includes(user.id) : false;

  React.useEffect(() => {
    // Cargar comentarios y usuarios
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comentarios_evento')
        .select('*')
        .eq('evento_id', event.id)
        .order('creado_en', { ascending: true });
      setComments(data || []);
      // Cargar usuarios de los comentarios
      if (data && data.length > 0) {
        const userMap: Record<string, any> = {};
        await Promise.all(
          Array.from(new Set(data.map((c: any) => c.autor_id))).map(async (userId: string) => {
            const userData = await getUserById(userId);
            if (userData) userMap[userId] = userData;
          })
        );
        setCommentUsers(userMap);
      }
    };
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('reacciones_evento')
        .select('usuario_id')
        .eq('evento_id', event.id);
      setLikes(data ? data.map((r: any) => r.usuario_id) : []);
    };
    fetchComments();
    fetchLikes();
  }, [event.id]);

  const handleLike = async () => {
    if (!user) return;
    if (isLiked) {
      await supabase
        .from('reacciones_evento')
        .delete()
        .eq('evento_id', event.id)
        .eq('usuario_id', user.id);
      setLikes(likes.filter(id => id !== user.id));
    } else {
      await supabase
        .from('reacciones_evento')
        .insert({ evento_id: event.id, usuario_id: user.id });
      setLikes([...likes, user.id]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      // Insertar en comentarios_evento
      const { data, error } = await supabase
        .from('comentarios_evento')
        .insert({ evento_id: event.id, autor_id: user.id, contenido: newComment.trim() })
        .select()
        .single();
      if (error) throw error;
      // Obtener datos de usuario para el nuevo comentario
      let userData = commentUsers[user.id];
      if (!userData) {
        userData = await getUserById(user.id);
        setCommentUsers(prev => ({ ...prev, [user.id]: userData }));
      }
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      toast.error('Error al agregar el comentario');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', event.id);
      if (error) throw error;
      toast.success('Evento eliminado exitosamente');
      if (typeof onDeleted === 'function') onDeleted();
    } catch (error) {
      toast.error('Error al eliminar el evento');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.titulo,
        text: event.descripcion,
        url: window.location.origin + '/eventos/' + event.id
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + '/eventos/' + event.id);
      toast.success('¡Enlace copiado!');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      <div className="relative h-48 w-full">
        <img
          src={event.imagen_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'}
          alt={event.titulo}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {event.titulo}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {event.descripcion}
            </p>
          </div>
        <div className="flex space-x-2 relative">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={e => { e.stopPropagation(); setShowMenu((v) => !v); }}
            aria-label="Abrir menú"
            data-menu="evento-menu"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in"
            >
              <ul className="py-2">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {navigator.clipboard.writeText(window.location.origin + '/eventos/' + event.id); setShowMenu(false); toast.success('¡Enlace copiado!')}}>
                    Guardar enlace
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleShare}>
                    Compartir evento
                  </button>
                </li>
                {isCreator && (
                  <>
                    <li>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { setShowMenu(false); onEdit && onEdit(); }}>
                        Editar evento
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={async () => { await handleDelete(); setShowMenu(false); }}>
                        Eliminar evento
                      </button>
                    </li>
                  </>
                )}
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={e => { e.stopPropagation(); setShowMenu(false); }}>
                    Cancelar
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        </div>

        {/* Fecha y categoría */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
            {event.categoria || event.categoria}
          </span>
          <span className="mx-2">•</span>
          {disableCardNavigation ? (
            <span><span className="sr-only">Fecha:</span> {format(new Date(event.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
          ) : (
            <Link to={`/eventos/${event.id}`} className="group hover:underline">
              <span><span className="sr-only">Fecha:</span> {format(new Date(event.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
            </Link>
          )}
        </div>

        {/* Reacciones y comentarios */}
        <div className="flex items-center space-x-6 mb-4">
          <button onClick={handleLike} className="flex items-center space-x-1 group">
            <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`} />
            <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`}>{likes.length}</span>
          </button>
          <button onClick={() => setIsCommentExpanded(!isCommentExpanded)} className="flex items-center space-x-1 group">
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-500">{comments.length}</span>
          </button>
        </div>

        {/* Formulario de comentario */}
        {user && (
          <form onSubmit={handleAddComment} className="flex items-center space-x-4 mb-4">
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.displayName || 'Usuario'}
              className="w-10 h-10 rounded-full"
            />
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <Send className="w-5 h-5 -mr-1" />
              <span>Enviar</span>
            </button>
          </form>
        )}

        {/* Comentarios */}
        {(comments.length > 0 && isCommentExpanded) && (
          <div className="space-y-4">
            {comments.map(comment => {
              const isCommentAuthor = comment.autor_id === user?.id;
              const commentUser = commentUsers[comment.autor_id];
              return (
                <div key={comment.id} className="flex items-start space-x-3">
                  <img
                    src={commentUser?.avatar || '/default-avatar.png'}
                    alt={commentUser?.displayName || 'Usuario'}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 p-4 text-sm bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {commentUser?.displayName || 'Usuario'}
                      </span>
                      {isCommentAuthor && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Deseas eliminar tu comentario?')) {
                              const { error } = await supabase
                                .from('comentarios_evento')
                                .delete()
                                .eq('id', comment.id);
                              if (error) {
                                toast.error('Error al eliminar el comentario');
                              } else {
                                setComments(comments.filter(c => c.id !== comment.id));
                                toast.success('Comentario eliminado');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-500"
                          aria-label="Eliminar comentario"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.contenido}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventoCulturalCard;