import React, { useEffect } from 'react';
import CreatePostForm from '../components/posts/CreatePostForm';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { usePostStore } from '../store/postStore';
import { useEventStore } from '../store/eventStore';
import { EventoCulturalCard } from '../components/cultural/EventoCulturalCard';

const HomePage = () => {
  const { posts, isLoading: isLoadingPosts, fetchPosts } = usePostStore();
  const { events, isLoading: isLoadingEvents, fetchEvents } = useEventStore();

  useEffect(() => {
    fetchPosts();
    fetchEvents();
  }, [fetchPosts, fetchEvents]);

  return (
    <div className="space-y-4">
      <CreatePostForm />

      {/* Eventos culturales destacados */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4">Eventos culturales</h2>
      {isLoadingEvents ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Cargando eventos..." />
        </div>
      ) : events.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay eventos culturales aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventoCulturalCard key={event.id} event={{
              id: event.id,
              titulo: event.title,
              descripcion: event.description,
              fecha_inicio: event.date,
              ubicacion: event.location || '',
              imagen_url: event.metadata?.imagen_url,
              categoria: '',
              tipo: event.type,
              metadata: {
                target_audience: event.metadata?.target_audience || '',
                responsible_person: event.metadata?.responsible_person || { name: '', phone: '' },
                technical_requirements: event.metadata?.technical_requirements || [],
                tags: event.metadata?.tags || [],
              }
            }} />
          ))}
        </div>
      )}

      {/* Posts */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8">Publicaciones</h2>
      {isLoadingPosts ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Loading posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your first post to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;