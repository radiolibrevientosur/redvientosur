import { useEffect, useState } from 'react';
import CreatePostForm from '../components/posts/CreatePostForm';
import PostCard from '../components/posts/PostCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import { usePostStore } from '../store/postStore';
import { useEventStore } from '../store/eventStore';
import EventoCulturalCard from '../components/cultural/EventoCulturalCard';
import CreateEventForm from '../components/calendar/CreateEventForm';
import { Event } from '../store/eventStore';

const FEED_MODES = [
  { label: 'Para ti', value: 'feed' },
  { label: 'Lo último', value: 'timeline' }
];

const HomePage = () => {
  const { posts, isLoading: isLoadingPosts, fetchPosts } = usePostStore();
  const { events, isLoading: isLoadingEvents, fetchEvents } = useEventStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [feedMode, setFeedMode] = useState<'feed' | 'timeline'>('feed');
  const [eventMode] = useState<'feed' | 'timeline'>('feed');
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

  // Handler genérico para compartir cualquier contenido
  // const handleShare = (type: 'post' | 'event', item: any) => {
  //   let url = window.location.origin;
  //   let title = '';
  //   let text = '';
  //   if (type === 'post') {
  //     url += '/posts/' + item.id;
  //     title = item.content?.slice(0, 60) || 'Post de Red Viento Sur';
  //     text = item.content;
  //   } else if (type === 'event') {
  //     url += '/eventos/' + item.id;
  //     title = item.titulo || item.title || 'Evento cultural';
  //     text = item.descripcion || item.description || '';
  //   }
  //   if (navigator.share) {
  //     navigator.share({ title, text, url }).catch(() => {});
  //   } else {
  //     navigator.clipboard.writeText(url);
  //     toast.success('¡Enlace copiado!');
  //   }
  // };



  return (
    <div className="space-y-4">
      <CreatePostForm onSuccess={() => {
        setTimeout(() => {
          const firstPost = document.querySelector('.feed-item');
          if (firstPost) firstPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }} />

      {/* Modal de edición de evento */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-lg relative">
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
                // category: editingEvent.metadata?.category || '', // Eliminar, no existe en metadata
                event_type: editingEvent.type,
                date: editingEvent.date.split('T')[0],
                location: editingEvent.location,
                target_audience: (['Infantil', 'Adultos', 'Todos'].includes(editingEvent.metadata?.target_audience ?? '')
                  ? editingEvent.metadata?.target_audience
                  : undefined) as 'Infantil' | 'Adultos' | 'Todos' | undefined,
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
      <div className="flex justify-center gap-4 my-4">
        {FEED_MODES.map((mode) => (
          <button
            key={mode.value}
            className={`px-4 py-2 rounded-full font-semibold transition-colors duration-150 ${feedMode === mode.value ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setFeedMode(mode.value as 'feed' | 'timeline')}
            aria-pressed={feedMode === mode.value}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Eventos culturales destacados */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4">Eventos culturales</h2>
      {isLoadingEvents ? (
        <div>
          {[...Array(2)].map((_, i) => <SkeletonCard key={i} type="event" />)}
        </div>
      ) : localEvents.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">No hay eventos culturales aún</p>
          <p className="text-sm text-gray-400">¡Sé el primero en crear un evento!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(eventMode === 'feed'
            ? localEvents.slice()
            : localEvents.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          ).map(event => (
            <EventoCulturalCard
              key={event.id}
              event={{
                id: event.id,
                titulo: event.title,
                descripcion: event.description,
                fecha_inicio: event.date,
                ubicacion: event.location || '',
                imagen_url: event.imagen_url,
                categoria: '',
                tipo: event.type,
                userId: event.userId,
                metadata: {
                  target_audience: event.metadata?.target_audience as any || '',
                  responsible_person: event.metadata?.responsible_person || { name: '', phone: '' },
                  technical_requirements: event.metadata?.technical_requirements || [],
                  tags: event.metadata?.tags || [],
                }
              }}
              onEdit={() => setEditingEvent(event)}
              onDeleted={() => {
                setLocalEvents((prev) => prev.filter((e) => e.id !== event.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Posts */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8">Publicaciones</h2>
      {isLoadingPosts ? (
        <div>
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} type="post" />)}
        </div>
      ) : localPosts.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">No hay publicaciones aún</p>
          <p className="text-sm text-gray-400">¡Crea tu primera publicación para comenzar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(feedMode === 'feed'
            ? localPosts.slice().sort((a, b) => b.likes.length - a.likes.length)
            : localPosts.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          ).map(post => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={() => {
                setLocalPosts((prev) => prev.filter((p) => p.id !== post.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;