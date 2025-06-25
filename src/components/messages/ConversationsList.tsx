import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRecentConversations } from '../../hooks/useRecentConversations';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import { UserSearch } from '../profile/UserSearch';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import './ConversationsList.mobile.css';

interface ConversationsListProps {
  onSelectUser: (userId: string, userName: string, userAvatar: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({ onSelectUser }) => {
  const { user } = useAuthStore();
  const { conversations, fetchConversations } = useRecentConversations(user?.id || '');
  const [showModal, setShowModal] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loading] = useState(false); // loading solo para compatibilidad visual, no se usa setLoading
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sugerencias reales: usuarios con los que no hay conversación reciente
  useEffect(() => {
    async function fetchSuggested() {
      setSuggestedLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre_usuario, nombre_completo, avatar_url')
        .neq('id', user?.id)
        .limit(5);
      if (!error && data) {
        // Excluir usuarios ya en conversaciones
        const convIds = conversations.map((c: any) => c.id);
        setSuggested(data.filter((u: any) => !convIds.includes(u.id)));
      } else {
        setSuggested([]);
      }
      setSuggestedLoading(false);
    }
    if (user?.id) fetchSuggested();
  }, [user, conversations]);

  // Handler para seleccionar usuario desde el buscador
  const handleUserSearchSelect = (selectedUser: any) => {
    setShowModal(false);
    if (selectedUser) {
      setSelectedConvId(selectedUser.id);
      onSelectUser(selectedUser.id, selectedUser.nombre_completo || selectedUser.nombre_usuario, selectedUser.avatar_url || '/default-avatar.png');
    }
  };

  // Handler para seleccionar conversación de la lista
  const handleSelectConv = (u: any) => {
    setSelectedConvId(u.id);
    onSelectUser(u.id, u.displayName, u.avatar);
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (!el || loading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setLimit((prev) => prev + 20);
        setHasMore(conversations.length > limit + 20);
      }
    };
    const el = listRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [loading, hasMore, conversations.length, limit]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Botón flotante para nueva conversación (solo móvil) */}
      <button
        className="fab-new-conv sm:hidden"
        aria-label="Iniciar nueva conversación"
        onClick={() => setShowModal(true)}
        type="button"
      >
        +
      </button>
      {/* Sugerencias horizontales arriba del buscador */}
      <div className="w-full px-2 pt-3 pb-1 border-b bg-gray-50">
        <div className="font-semibold text-xs text-gray-500 mb-1 ml-1">Sugerencias</div>
        <div className="overflow-x-auto flex gap-3 no-scrollbar pb-2">
          {suggestedLoading ? (
            <div className="text-xs text-gray-400 flex items-center">Cargando...</div>
          ) : suggested.length === 0 ? (
            <div className="text-xs text-gray-400 flex items-center">Sin sugerencias</div>
          ) : suggested.map((s) => (
            <div key={s.id} className="flex flex-col items-center min-w-[90px] max-w-[110px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-lg p-2 cursor-pointer hover:bg-blue-50 transition-all touch-target"
              tabIndex={0}
              role="button"
              aria-label={`Sugerencia: ${s.nombre_completo || s.nombre_usuario}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
              onClick={async () => {
                if (!user) return;
                const existing = conversations.find((c: any) => c.id === s.id);
                if (!existing) {
                  await supabase.from('conversaciones').insert({ user1: user.id, user2: s.id });
                  await fetchConversations();
                }
                window.location.href = `/chat?userId=${s.id}&userName=${encodeURIComponent(s.nombre_completo || s.nombre_usuario)}&userAvatar=${encodeURIComponent(s.avatar_url || '/default-avatar.png')}`;
              }}
            >
              <img src={s.avatar_url || '/default-avatar.png'} alt={s.nombre_completo || s.nombre_usuario} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 mb-1" />
              <div className="font-medium text-xs truncate text-gray-900 dark:text-gray-100 text-center w-full">{s.nombre_completo || s.nombre_usuario}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">@{s.nombre_usuario}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Header con input sticky */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900 shadow-sm">
        <input
          type="text"
          className="w-full max-w-xs px-3 py-3 rounded bg-white border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Buscar conversaciones..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Modal para buscar usuario */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="pt-1 pb-1 px-0">
          <h2 className="font-bold mb-1 text-lg text-center">Buscar usuario para chatear</h2>
          <UserSearch onSelectUser={(user: any) => { handleUserSearchSelect(user); }} />
        </div>
      </Modal>
      {/* Lista de conversaciones */}
      <div ref={listRef} className="flex-1 overflow-y-auto divide-y pb-24 sm:pb-4" style={{ minHeight: 0 }}>
        <AnimatePresence initial={false}>
        {loading ? (
          <div className="p-4">Cargando conversaciones...</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4" data-testid="no-conversations">
            <span className="text-gray-400 text-center">No tienes conversaciones aún.</span>
            <button
              className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 transition text-sm"
              onClick={() => setShowModal(true)}
              data-testid="start-conversation-btn"
            >
              Iniciar nueva conversación
            </button>
          </div>
        ) : (
          conversations
            .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
            .filter(u => {
              const q = search.toLowerCase();
              return (
                (u.displayName?.toLowerCase().includes(q) ||
                 u.username?.toLowerCase().includes(q))
              );
            })
            .slice(0, limit)
            .map((u) => (
              <motion.div
                key={u.id}
                data-testid="conversation-item"
                className={`relative p-5 cursor-pointer flex items-center gap-4 rounded-lg transition-all touch-target group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm ${selectedConvId === u.id ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                tabIndex={0}
                role="button"
                aria-label={`Conversación con ${u.displayName}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.18 }}
                onClick={() => handleSelectConv(u)}
                onTouchStart={e => {
                  swipeStartX.current = e.touches[0].clientX;
                  setSwipeId(u.id);
                }}
                onTouchMove={e => {
                  if (swipeStartX.current !== null && swipeId === u.id) {
                    const deltaX = e.touches[0].clientX - swipeStartX.current;
                    if (Math.abs(deltaX) > 0) setSwipeX(deltaX);
                  }
                }}
                onTouchEnd={async () => {
                  if (swipeStartX.current !== null && swipeId === u.id) {
                    if (swipeX < -80) {
                      // Swipe a la izquierda: eliminar
                      if (user && window.confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) {
                        try {
                          const { error } = await supabase.from('messages')
                            .delete()
                            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`);
                          if (error) throw error;
                          await fetchConversations();
                          toast.success('Conversación eliminada');
                        } catch {
                          toast.error('Error al eliminar la conversación');
                        }
                      }
                    } else if (swipeX > 80) {
                      // Swipe a la derecha: archivar (simulado)
                      toast('Conversación archivada (demo)');
                    }
                    setSwipeX(0);
                    setSwipeId(null);
                    swipeStartX.current = null;
                  }
                }}
                style={swipeId === u.id ? { transform: `translateX(${swipeX}px)`, transition: 'transform 0.15s' } : {}}
              >
                <span className="relative inline-block">
                  <img src={u.avatar} alt={u.displayName} className="w-12 h-12 rounded-full mr-2 object-cover" loading="lazy" />
                  {/* Indicador de estado en línea/offline */}
                  <span
                    className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    title={u.isOnline ? 'En línea' : 'Desconectado'}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">{u.displayName}</span>
                    {u.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 px-1 ml-1" aria-label={`${u.unreadCount} mensajes no leídos`}>
                        {u.unreadCount > 9 ? '9+' : u.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-300 truncate max-w-[180px]">{u.lastMessage}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-300">{new Date(u.lastTime).toLocaleString()}</div>
                </div>
                {/* Botón eliminar conversación */}
                <button
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-100 text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title={`Eliminar conversación con ${u.displayName}`}
                  aria-label={`Eliminar conversación con ${u.displayName}`}
                  tabIndex={0}
                  disabled={!user}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && user) e.currentTarget.click(); }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) return;
                    if (!window.confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return;
                    try {
                      const { error } = await supabase.from('messages')
                        .delete()
                        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`);
                      if (error) throw error;
                      await fetchConversations();
                      toast.success('Conversación eliminada');
                    } catch (err) {
                      toast.error('Error al eliminar la conversación');
                    }
                  }}
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                {/* Indicador visual de swipe */}
                {swipeId === u.id && Math.abs(swipeX) > 40 && (
                  <span className={`absolute inset-y-0 ${swipeX < 0 ? 'right-4 text-red-600' : 'left-4 text-blue-600'} flex items-center text-lg font-bold pointer-events-none`}>
                    {swipeX < 0 ? 'Eliminar' : 'Archivar'}
                  </span>
                )}
              </motion.div>
            ))
        )}
        </AnimatePresence>
        {hasMore && !loading && (
          <div className="p-4 text-center text-gray-400">Cargando más...</div>
        )}
      </div>
    </div>
  );
};
