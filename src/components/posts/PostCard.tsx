import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { Post, formatPostDate, getUserById } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import MediaCarousel, { MediaItem } from './subcomponents/MediaCarousel';
import LinkPreview, { LinkData } from './subcomponents/LinkPreview';
import Poll, { PollData } from './subcomponents/Poll';

interface PostCardProps {
  post: Post;
  disableCardNavigation?: boolean;
  onDeleted?: () => void;
  user: { nombre: string; avatar: string; verificado?: boolean; id?: string };
  media?: MediaItem[];
  text: string;
  backgroundColor?: string;
  linkData?: LinkData;
  pollData?: PollData;
  onVote?: (optionId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, disableCardNavigation, onDeleted, user, media, text, backgroundColor, linkData, pollData, onVote }) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postUser, setPostUser] = useState<any>(null);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [loadingUser, setLoadingUser] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuthStore();
  const [likes, setLikes] = useState<string[]>(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [isLiked, setIsLiked] = useState(currentUser ? post.likes.includes(currentUser.id) : false);
  const [isFavorite, setIsFavorite] = useState(post.isFavorite);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Cargar usuario del post
  useEffect(() => {
    let isMounted = true;
    setLoadingUser(true);
    (async () => {
      const u = await getUserById(post.userId);
      if (isMounted) {
        setPostUser(u);
        setLoadingUser(false);
      }
    })();
    return () => { isMounted = false; };
  }, [post.userId]);

  // Cargar usuarios de los comentarios
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ids = Array.from(new Set(post.comments
        .map(c => c.userId)
        .filter(id => typeof id === 'string' && id && id !== 'undefined' && /^[0-9a-fA-F-]{36}$/.test(id))
      ));
      const users: Record<string, any> = {};
      await Promise.all(ids.map(async (id) => {
        if (!id || id === 'undefined') return;
        if (id === user?.id) {
          users[id] = user; // Usa el usuario actual si corresponde
        } else {
          const u = await getUserById(id);
          if (u) users[id] = u;
        }
      }));
      if (isMounted) {
        setCommentUsers(users);
      }
    })();
    return () => { isMounted = false; };
  }, [post.comments, user]);

  // Reacción (like)
  const handleLike = async () => {
    if (!currentUser || isLoadingReaction) return;
    setIsLoadingReaction(true);
    try {
      if (isLiked) {
        await supabase.from('reacciones_post').delete().eq('post_id', post.id).eq('usuario_id', currentUser.id);
        setLikes(likes.filter(id => id !== currentUser.id));
      } else {
        await supabase.from('reacciones_post').insert({ post_id: post.id, usuario_id: currentUser.id, tipo: 'like' });
        setLikes([...likes, currentUser.id]);
      }
      setIsLiked(!isLiked);
    } catch {
      toast.error('Error al actualizar reacción');
    } finally {
      setIsLoadingReaction(false);
    }
  };

  // Comentario
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!currentUser) {
      setCommentError('Debes iniciar sesión para comentar.');
      return;
    }
    if (!commentText.trim()) {
      setCommentError('El comentario no puede estar vacío.');
      return;
    }
    setIsLoadingComment(true);
    try {
      const { data, error } = await supabase.from('comentarios_post').insert({ post_id: post.id, autor_id: currentUser.id, contenido: commentText.trim() }).select().single();
      if (error) throw error;
      setComments([...comments, { id: data.id, userId: data.autor_id, content: data.contenido, createdAt: data.creado_en }]);
      setCommentText('');
    } catch {
      setCommentError('Error al agregar comentario.');
    } finally {
      setIsLoadingComment(false);
    }
  };

  // Asegura que handleShare esté correctamente definido y asignado al botón
  const handleShare = async () => {
    try {
      const url = window.location.origin + '/posts/' + post.id;
      if (navigator.share) {
        await navigator.share({
          title: post.content?.slice(0, 60) || 'Post de Red Viento Sur',
          text: post.content,
          url
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('¡Enlace copiado!');
      } else {
        // Fallback: input temporal
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast.success('¡Enlace copiado!');
      }
    } catch (e) {
      toast.error('No se pudo compartir el enlace');
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.userId) return;
    if (!window.confirm('¿Estás seguro de eliminar este post?')) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      if (error) throw error;
      toast.success('Post eliminado exitosamente');
      if (typeof onDeleted === 'function') onDeleted();
    } catch (error) {
      toast.error('Error al eliminar el post');
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    // Insertar emoji en la posición actual del cursor
    if (commentInputRef.current) {
      const input = commentInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        commentText.slice(0, start) +
        (emoji.native || emoji.skins?.[0]?.native || '') +
        commentText.slice(end);
      setCommentText(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 2); // 2 = longitud típica de emoji
      }, 0);
    } else {
      setCommentText(commentText + (emoji.native || emoji.skins?.[0]?.native || ''));
    }
    setShowEmojiPicker(false);
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((v) => {
      const next = !v;
      if (next && menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
      return next;
    });
  };
  
  // Estados y funciones para edición y reacciones de comentarios
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentReactions, setCommentReactions] = useState<Record<string, { isReacted: boolean; likesCount: number }>>({});

  useEffect(() => {
    if (!currentUser) return;
    const reactions: Record<string, { isReacted: boolean; likesCount: number }> = {};
    comments.forEach(comment => {
      if (Array.isArray(comment.reactions)) {
        reactions[comment.id] = {
          isReacted: comment.reactions.some(r => r.tipo === 'like' && r.usuario_id === currentUser.id),
          likesCount: comment.reactions.filter(r => r.tipo === 'like').length
        };
      } else {
        reactions[comment.id] = { isReacted: false, likesCount: 0 };
      }
    });
    setCommentReactions(reactions);
  }, [comments, currentUser]);

  const startEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  };
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };
  const saveEditComment = async (comment: any) => {
    if (!editingCommentText.trim()) return;
    try {
      await supabase.from('comentarios_post').update({ contenido: editingCommentText }).eq('id', comment.id);
      setComments(comments.map(c => c.id === comment.id ? { ...c, content: editingCommentText } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch {
      toast.error('Error al editar comentario');
    }
  };
  const handleDeleteComment = async (comment: any) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await supabase.from('comentarios_post').delete().eq('id', comment.id);
      setComments(comments.filter(c => c.id !== comment.id));
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };
  const handleCommentLike = async (comment: any) => {
    if (!currentUser) return;
    const prev = commentReactions[comment.id] || { isReacted: false, likesCount: 0 };
    try {
      if (prev.isReacted) {
        await supabase.from('reacciones_comentario').delete().eq('comentario_id', comment.id).eq('usuario_id', currentUser.id);
        setCommentReactions({
          ...commentReactions,
          [comment.id]: { isReacted: false, likesCount: Math.max(0, prev.likesCount - 1) }
        });
      } else {
        await supabase.from('reacciones_comentario').insert({ comentario_id: comment.id, usuario_id: currentUser.id, tipo: 'like' });
        setCommentReactions({
          ...commentReactions,
          [comment.id]: { isReacted: true, likesCount: prev.likesCount + 1 }
        });
      }
    } catch {
      toast.error('Error al reaccionar');
    }
  };
  
  if (!post || !postUser) {
    return null;
  }
  
  return (
    <article className="feed-item w-full border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none rounded-none">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          {postUser?.username ? (
            <Link to={`/profile/${postUser.username}`} className="avatar" aria-label={`Ver perfil de ${postUser.displayName || 'Usuario'}`}> 
              {loadingUser ? (
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <img 
                  src={postUser?.avatar || '/default-avatar.png'} 
                  alt={postUser?.displayName || 'Usuario'} 
                  className="avatar-img"
                />
              )}
            </Link>
          ) : (
            <div className="avatar">
              <img 
                src={postUser?.avatar || '/default-avatar.png'} 
                alt={postUser?.displayName || 'Usuario'} 
                className="avatar-img opacity-50"
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {loadingUser ? (
                <span className="bg-gray-200 rounded w-20 h-4 inline-block animate-pulse" />
              ) : postUser?.username ? (
                <Link to={`/profile/${postUser.username}`} className="hover:underline" aria-label={`Ver perfil de ${postUser.displayName || 'Usuario'}`}> 
                  {postUser?.displayName || 'Usuario'}
                </Link>
              ) : (
                <span className="text-gray-400">{postUser?.displayName || 'Usuario'}</span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {disableCardNavigation ? (
                <span>{formatPostDate(post.createdAt)}</span>
              ) : (
                <Link to={`/posts/${post.id}`} className="hover:underline" onClick={e => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-menu="post-menu"]')) {
                    e.preventDefault();
                  }
                }}>
                  <span>{formatPostDate(post.createdAt)}</span>
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative">
          <button
            ref={menuButtonRef}
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleMenuClick}
            aria-label="Abrir menú"
            data-menu="post-menu"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          {showMenu && menuPosition && ReactDOM.createPortal(
            <div
              className="z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in"
              style={{
                position: 'absolute',
                top: menuPosition.top,
                left: menuPosition.left,
                overflow: 'visible',
              }}
            >
              <ul className="py-2">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {navigator.clipboard.writeText(window.location.origin + '/posts/' + post.id); setShowMenu(false); toast.success('¡Enlace copiado!')}}>
                    Guardar enlace
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleShare}>
                    Compartir publicación
                  </button>
                </li>
                {user && user.id === post.userId && (
                  <>
                    <li>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {setShowMenu(false); /* Aquí podrías abrir un modal de edición */}}>
                        Editar publicación
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={async () => {await handleDelete(); setShowMenu(false);}}>
                        Eliminar publicación
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
            </div>,
            document.body
          )}
        </div>
      </div>
      
      {/* Post Media */}
      {media && media.length > 0 && (
        <MediaCarousel media={media} />
      )}
      {/* Link Preview */}
      {linkData && <LinkPreview link={linkData} />}
      {/* Poll */}
      {pollData && <Poll poll={pollData} onVote={onVote ?? (() => {})} />}
      
      {/* Post Content (TEXTO) debajo del media */}
      <div className="px-4 pb-3 pt-2" style={backgroundColor ? { backgroundColor } : {}}>
        {/* Aquí puedes usar una función para resaltar hashtags y menciones */}
        <span>{text}</span>
      </div>
      
      {/* Depuración: solo una sección de acciones, sin duplicados */}
      <div className="flex items-center space-x-4 py-2 px-4 justify-between">
        <div className="flex items-center space-x-6">
          {/* Like */}
          <button onClick={handleLike} aria-label="Me gusta" className="flex items-center group" disabled={isLoadingReaction}>
            <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`} />
            <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`}>{likes.length}</span>
          </button>
          {/* Comentarios */}
          <button onClick={() => setIsCommentExpanded(true)} aria-label="Comentarios" className="flex items-center group">
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-500">{comments.length}</span>
          </button>
          {/* Compartir */}
          <button onClick={handleShare} aria-label="Compartir publicación" className="flex items-center group">
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
          </button>
          {/* Guardar (favorito) */}
          <button onClick={() => setIsFavorite(fav => !fav)} aria-label="Guardar publicación" className="flex items-center group">
            <Bookmark className={`h-5 w-5 ${isFavorite ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-500'}`} />
          </button>
        </div>
      </div>
      
      {/* Comments */}
      {(comments.length > 0 || isCommentExpanded) && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700 transition-all duration-300">
          {comments.length > 0 && (
            <div className="mb-3 space-y-3">
              {comments.slice(0, isCommentExpanded ? undefined : 2).map(comment => {
                const commentUser = comment.userId === (currentUser && currentUser.id) ? currentUser : commentUsers[comment.userId];
                const isOwnComment = currentUser && comment.userId === currentUser.id;
                const reaction = commentReactions[comment.id] || { isReacted: false, likesCount: 0 };
                const isEditing = editingCommentId === comment.id;
                return (
                  <div key={comment.id} className="flex space-x-2 animate-fade-in">
                    <div className="flex-shrink-0">
                      <div className="avatar w-9 h-9 border-2 border-primary-200 dark:border-primary-700 shadow-sm">
                        <img 
                          src={commentUser?.avatar || '/default-avatar.png'} 
                          alt={commentUser?.displayName || 'Usuario'} 
                          className="avatar-img rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">
                          {commentUser?.displayName || 'Usuario'}
                        </p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                              maxLength={300}
                            />
                            <button onClick={() => saveEditComment(comment)} className="text-primary-600 dark:text-primary-400 text-xs font-bold">Guardar</button>
                            <button onClick={cancelEditComment} className="text-xs text-gray-400">Cancelar</button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                            {comment.content}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <button onClick={() => handleCommentLike(comment)} className="flex items-center text-xs text-gray-500 hover:text-primary-500">
                            <Heart className={`w-4 h-4 mr-1 ${reaction.isReacted ? 'text-red-500 fill-red-500' : ''}`} />
                            {reaction.likesCount > 0 && <span>{reaction.likesCount}</span>}
                          </button>
                          <button onClick={() => { setCommentText(`@${commentUser?.displayName || 'Usuario'} `); setIsCommentExpanded(true); commentInputRef.current?.focus(); }} className="text-xs text-gray-500 hover:text-primary-500">Responder</button>
                          {isOwnComment && !isEditing && (
                            <>
                              <button onClick={() => startEditComment(comment.id, comment.content)} className="text-xs text-gray-500 hover:text-primary-500">Editar</button>
                              <button onClick={() => handleDeleteComment(comment)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 pl-2">
                        {formatPostDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {comments.length > 2 && !isCommentExpanded && (
                <button 
                  onClick={() => setIsCommentExpanded(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline mt-2"
                >
                  Ver todos los {comments.length} comentarios
                </button>
              )}
            </div>
          )}
          {currentUser && (
            <form onSubmit={handleComment} className="flex items-center space-x-2 relative mt-2">
              <div className="avatar w-9 h-9">
                <img 
                  src={currentUser.avatar || '/default-avatar.png'} 
                  alt={currentUser.displayName || 'Usuario'} 
                  className="avatar-img rounded-full object-cover border border-primary-200 dark:border-primary-700"
                />
              </div>
              <input
                type="text"
                placeholder="Añade un comentario..."
                className={`flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all ${commentError ? 'border-red-500' : ''}`}
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); setCommentError(null); }}
                maxLength={300}
                autoComplete="off"
                disabled={isLoadingComment}
                aria-invalid={!!commentError}
              />
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowEmojiPicker((v) => !v)}
                aria-label="Insertar emoji"
                tabIndex={-1}
              >
                <span role="img" aria-label="emoji">😊</span>
              </button>
              <button 
                type="submit"
                disabled={!commentText.trim() || isLoadingComment}
                className="text-sm font-bold text-primary-600 dark:text-primary-400 disabled:opacity-50 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800 transition-all"
              >
                {isLoadingComment ? '...' : 'Publicar'}
              </button>
              {showEmojiPicker && (
                <div className="absolute z-50 bottom-12 right-0">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
                </div>
              )}
              {commentError && (
                <span className="absolute left-0 -bottom-6 text-xs text-red-500 font-medium">{commentError}</span>
              )}
            </form>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;

/*
// Ejemplos de uso

// Post solo texto
<PostCard
  user={{ nombre: 'Ana', avatar: '/ana.png', verificado: true }}
  date="2025-06-18T12:00:00Z"
  text="¡Hola mundo! #bienvenidos @usuario"
  stats={{ likes: 10, comentarios: 2, compartidos: 1 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
/>

// Post con imagen y link preview
<PostCard
  user={{ nombre: 'Luis', avatar: '/luis.png' }}
  date="2025-06-18T13:00:00Z"
  text="Mira este enlace: https://ejemplo.com"
  media={[{ url: '/foto.jpg', type: 'image', aspectRatio: '1:1' }]}
  linkData={{ url: 'https://ejemplo.com', image: '/preview.jpg', title: 'Ejemplo', description: 'Descripción del enlace' }}
  stats={{ likes: 5, comentarios: 1, compartidos: 0 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
/>

// Post con carrusel y encuesta
<PostCard
  user={{ nombre: 'Sofía', avatar: '/sofia.png' }}
  date="2025-06-18T14:00:00Z"
  text="¿Cuál prefieres?"
  media={[
    { url: '/img1.jpg', type: 'image', aspectRatio: '4:5' },
    { url: '/img2.jpg', type: 'image', aspectRatio: '1.91:1' }
  ]}
  pollData={{
    question: 'Elige una opción',
    options: [
      { id: '1', text: 'Opción 1', votes: 3 },
      { id: '2', text: 'Opción 2', votes: 7 }
    ],
    totalVotes: 10
  }}
  stats={{ likes: 8, comentarios: 3, compartidos: 2, votos: 10 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
  onVote={id => {}}
/>
*/