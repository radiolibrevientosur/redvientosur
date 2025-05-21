import { create } from 'zustand';
import { toast } from 'sonner';
import { addDays, format, parse, startOfToday } from 'date-fns';
import { supabase } from '../lib/supabase';

export type EventType = 'event' | 'task' | 'birthday';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  time?: string;
  location?: string;
  userId: string;
  createdAt: string;
}

interface EventState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsByDate: (date: Date) => Event[];
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: events, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;

      const transformedEvents: Event[] = events.map(event => ({
        id: event.id,
        title: event.titulo,
        description: event.descripcion || '',
        type: event.tipo as EventType,
        date: event.fecha_inicio,
        time: format(new Date(event.fecha_inicio), 'HH:mm'),
        location: event.ubicacion,
        userId: event.creador_id,
        createdAt: event.creado_en
      }));

      set({ events: transformedEvents, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar eventos', 
        isLoading: false 
      });
    }
  },
  
  addEvent: async (event) => {
    set({ isLoading: true, error: null });
    try {
      const eventDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const { data, error } = await supabase
        .from('eventos')
        .insert({
          titulo: event.title,
          descripcion: event.description,
          tipo: event.type,
          fecha_inicio: eventDate.toISOString(),
          ubicacion: event.location,
          creador_id: event.userId,
          estado: 'publicado'
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: Event = {
        id: data.id,
        title: data.titulo,
        description: data.descripcion || '',
        type: data.tipo,
        date: data.fecha_inicio,
        time: event.time,
        location: data.ubicacion,
        userId: data.creador_id,
        createdAt: data.creado_en
      };
      
      set(state => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
      
      toast.success('¡Evento creado exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear evento', 
        isLoading: false 
      });
      toast.error('Error al crear evento');
    }
  },
  
  updateEvent: async (id, eventData) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: any = {};
      
      if (eventData.title) updateData.titulo = eventData.title;
      if (eventData.description) updateData.descripcion = eventData.description;
      if (eventData.type) updateData.tipo = eventData.type;
      if (eventData.date) {
        const eventDate = new Date(eventData.date);
        if (eventData.time) {
          const [hours, minutes] = eventData.time.split(':');
          eventDate.setHours(parseInt(hours), parseInt(minutes));
        }
        updateData.fecha_inicio = eventDate.toISOString();
      }
      if (eventData.location) updateData.ubicacion = eventData.location;

      const { error } = await supabase
        .from('eventos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        events: state.events.map(event =>
          event.id === id ? { ...event, ...eventData } : event
        ),
        isLoading: false
      }));
      
      toast.success('¡Evento actualizado exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar evento', 
        isLoading: false 
      });
      toast.error('Error al actualizar evento');
    }
  },
  
  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        events: state.events.filter(event => event.id !== id),
        isLoading: false
      }));
      
      toast.success('¡Evento eliminado exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar evento', 
        isLoading: false 
      });
      toast.error('Error al eliminar evento');
    }
  },
  
  getEventsByDate: (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return get().events.filter(event => {
      const eventDate = format(new Date(event.date), 'yyyy-MM-dd');
      return eventDate === dateString;
    });
  }
}));

// Format event date for display
export const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'EEEE, MMMM do yyyy');
};

// Format event time for display
export const formatEventTime = (timeString?: string) => {
  if (!timeString) return '';
  try {
    const time = parse(timeString, 'HH:mm', new Date());
    return format(time, 'h:mm a');
  } catch (error) {
    return timeString;
  }
};