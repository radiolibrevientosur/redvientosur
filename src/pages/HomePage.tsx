import { useEffect, useState } from 'react';
import CreatePostForm from '../components/posts/CreatePostForm';
import PostCard from '../components/posts/PostCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import { usePostStore } from '../store/postStore';
import { useEventStore } from '../store/eventStore';
import EventoCulturalCard from '../components/cultural/EventoCulturalCard';
import CreateEventForm from '../components/calendar/CreateEventForm';
import { Event } from '../store/eventStore';
import StoriesPage from './StoriesPage';
import SuggestionsToFollow from '../components/profile/SuggestionsToFollow';

const FEED_MODES = [
  { label: 'Para ti', value: 'feed' },
  { label: 'Lo último', value: 'timeline' }
];

const HomePage = () => {
  const { posts, isLoading: isLoadingPosts, fetchPosts } = usePostStore();
  const { events, isLoading: isLoadingEvents, fetchEvents } = useEventStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [feedMode, setFeedMode] = useState<'feed' | 'timeline'>('feed');
  // Estados locales para manipulación inmediata de UI
  const [localPosts, setLocalPosts] = useState(posts);
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  useEffect(() => {
    fetchPosts();
    fetchEvents();
  }, [fetchPosts, fetchEvents]);

  // Simulación de cumpleaños (puedes reemplazar por tu fuente real)
  const [localBirthdays] = useState<any[]>([
    // Ejemplo:
    // { id: 'b1', name: 'Juan Pérez', date: '2025-06-01' },
  ]);

  // Unificar feed: posts, eventos y cumpleaños
  const unifiedFeed = [
    ...localPosts.map(post => ({
      type: 'post',
      date: new Date(post.createdAt),
      post
    })),
    ...localEvents
      .filter(event => event.date && !isNaN(new Date(event.date).getTime()))
      .map(event => ({
        type: 'event',
        date: new Date(event.date),
        event
      })),
    ...localBirthdays.map(birthday => ({
      type: 'birthday',
      date: new Date(birthday.date),
      birthday
    }))
  ];

  // Ordenar según modo
  const sortedFeed = feedMode === 'feed'
    ? unifiedFeed.slice().sort((a, b) => {
        if (a.type === 'post' && b.type === 'post' && 'post' in a && 'post' in b) {
          return b.post.likes.length - a.post.likes.length;
        }
        // Si solo uno es post, el post va primero
        if (a.type === 'post') return -1;
        if (b.type === 'post') return 1;
        // Si ambos no son post, ordenar por fecha
        return b.date.getTime() - a.date.getTime();
      })
    : unifiedFeed.slice().sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="w-full pb-24 bg-white dark:bg-gray-900">
      {/* Stories Circles en la parte superior */}
      <StoriesPage />
      {/* Formulario para crear post */}
      <div className="w-full">
        <CreatePostForm 
          className="rounded-none mx-0"
          onSuccess={() => {
            setTimeout(() => {
              const firstPost = document.querySelector('.feed-item');
              if (firstPost) firstPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }} 
        />
      </div>
      {/* Sugerencias de perfiles a seguir debajo del textarea, solo móvil */}
      <div className="block sm:hidden mb-2 w-full">
        <SuggestionsToFollow />
      </div>
      {/* Sugerencias de perfiles a seguir en escritorio */}
      <div className="hidden sm:block w-full">
        <SuggestionsToFollow />
      </div>
      {/* Modal de edición de evento */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 w-full max-w-lg relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={() => setEditingEvent(null)}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Editar evento</h2>
            <CreateEventForm
              date={new Date(editingEvent.date)}
              onSuccess={() => { setEditingEvent(null); fetchEvents(); }}
              onCancel={() => setEditingEvent(null)}
              initialData={{
                id: editingEvent.id,
                title: editingEvent.title,
                description: editingEvent.description,
                event_type: editingEvent.type,
                date: editingEvent.date.split('T')[0],
                location: editingEvent.location,
                target_audience: (['Infantil', 'Adultos', 'Todo Público'].includes(editingEvent.metadata?.target_audience ?? '')
                  ? editingEvent.metadata?.target_audience
                  : undefined) as 'Infantil' | 'Adultos' | 'Todo Público' | undefined,
                cost: { type: 'free' },
                responsible_person: editingEvent.metadata?.responsible_person || { name: '', phone: '' },
                technical_requirements: editingEvent.metadata?.technical_requirements || [],
                image_url: editingEvent.imagen_url,
                tags: editingEvent.metadata?.tags || [],
                recurrence: (
                  editingEvent.metadata?.recurrence &&
                  typeof editingEvent.metadata?.recurrence.type === 'string' &&
                  ['custom', 'none', 'daily', 'weekly', 'monthly'].includes(editingEvent.metadata?.recurrence.type)
                )
                  ? {
                      ...editingEvent.metadata?.recurrence,
                      type: editingEvent.metadata?.recurrence.type as 'custom' | 'none' | 'daily' | 'weekly' | 'monthly'
                    }
                  : { type: 'none' }
              }}
            />
          </div>
        </div>
      )}
      {/* Selector Feed/Timeline */}
      <div className="flex justify-center gap-2 my-2 sm:my-4">
        {FEED_MODES.map((mode) => (
          <button
            key={mode.value}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full font-semibold transition-colors duration-150 text-xs sm:text-base ${feedMode === mode.value ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setFeedMode(mode.value as 'feed' | 'timeline')}
            aria-pressed={feedMode === mode.value}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {/* Feed unificado */}
      {(isLoadingPosts || isLoadingEvents) ? (
        <div>
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} type="post" />)}
        </div>
      ) : sortedFeed.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">No hay novedades aún</p>
          <p className="text-sm text-gray-400">¡Crea tu primera publicación, evento o cumpleaños para comenzar!</p>
        </div>
      ) : (
        <div className="w-full">
          {sortedFeed.map((item) => {
            if (item.type === 'post' && 'post' in item) {
              const post = item.post;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  user={{
                    nombre: post.autor?.displayName || 'Usuario',
                    avatar: post.autor?.avatar || '/default-avatar.png',
                    verificado: post.autor?.verificado || false
                  }}
                  date={post.createdAt}
                  media={post.mediaUrls}
                  text={post.content}
                  backgroundColor={post.backgroundColor}
                  linkData={post.linkData}
                  pollData={post.pollData}
                  stats={{
                    likes: post.likes?.length || 0,
                    comentarios: post.comments?.length || 0,
                    compartidos: post.shares || 0,
                    votos: post.pollData?.totalVotes || 0
                  }}
                  onLike={() => usePostStore.getState().toggleLike(post.id, post.userId)}
                  onComment={() => {}}
                  onShare={() => {}}
                  onVote={() => {}}
                  onFavorite={() => usePostStore.getState().toggleFavorite(post.id)}
                  actions={[]}
                  onDeleted={() => setLocalPosts((prev) => prev.filter((p) => p.id !== post.id))}
                />
              );
            }
            if (item.type === 'event' && 'event' in item) {
              return <EventoCulturalCard key={item.event.id} event={{
                id: item.event.id,
                titulo: item.event.title,
                descripcion: item.event.description,
                fecha_inicio: item.event.date,
                ubicacion: item.event.location || '',
                imagen_url: item.event.imagen_url,
                categoria: '',
                tipo: item.event.type,
                userId: item.event.userId,
                metadata: {
                  target_audience: item.event.metadata?.target_audience as any || '',
                  responsible_person: item.event.metadata?.responsible_person || { name: '', phone: '' },
                  technical_requirements: item.event.metadata?.technical_requirements || [],
                  tags: item.event.metadata?.tags || [],
                }
              }} onEdit={() => setEditingEvent(item.event)} onDeleted={() => setLocalEvents((prev) => prev.filter((e) => e.id !== item.event.id))} />;
            }
            if (item.type === 'birthday' && 'birthday' in item) {
              return <div key={item.birthday.id} className="card feed-item rounded-none mx-0">Cumpleaños: {item.birthday.name}</div>;
            }
            return null;
          })}
        </div>
      )}
      {/* Botón flotante para escribir mensaje, igual que el de crear blog */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          className="btn btn-primary rounded-full p-4 shadow-lg text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={() => window.dispatchEvent(new CustomEvent('openConversationsModal'))}
          aria-label="Escribir mensaje"
          tabIndex={0}
        >
          {/* Cambia el icono por una burbuja de mensajes (MessageCircle de lucide-react) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12c0 4.556-4.686 8.25-9.75 8.25-1.13 0-2.25-.17-3.3-.5l-4.2 1.25a.75.75 0 01-.94-.94l1.25-4.2c-.33-1.05-.5-2.17-.5-3.3C2.25 7.186 5.944 2.5 12 2.5s9.75 4.686 9.75 9.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HomePage;
