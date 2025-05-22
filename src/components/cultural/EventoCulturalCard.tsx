import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  Heart, 
  Edit, 
  Trash, 
  MessageCircle, 
  ThumbsUp, 
  PartyPopper, 
  Send 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface EventoCulturalCardProps {
  event: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    ubicacion: string;
    imagen_url?: string;
    categoria: string;
    tipo: string;
    metadata: {
      target_audience: string;
      responsible_person: {
        name: string;
        phone: string;
        social_media?: string;
      };
      technical_requirements: string[];
      tags: string[];
    };
  };
  onEdit?: () => void;
}

export const EventoCulturalCard: React.FC<EventoCulturalCardProps> = ({ event, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      toast.success('Evento eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast.error('Error al eliminar el evento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Debes iniciar sesión para comentar');
        return;
      }

      const { error } = await supabase
        .from('comentarios')
        .insert({
          evento_id: event.id,
          autor_id: userData.user.id,
          contenido: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      toast.error('Error al agregar el comentario');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
      {event.imagen_url && (
        <div className="relative h-48 w-full">
          <img
            src={event.imagen_url}
            alt={event.titulo}
            className="w-full h-full object-cover"
          />
        </div>
      )}

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
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <Trash className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(new Date(event.fecha_inicio), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.ubicacion}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4 mr-2" />
            <span>{event.metadata.target_audience}</span>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
            <button
              type="submit"
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};