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
  date: string; // ISO string
  time?: string; // HH:MM format
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

// Sample events for the demo
const today = startOfToday();
const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Art Exhibition Opening',
    description: 'New contemporary art exhibition opening',
    type: 'event',
    date: today.toISOString(),
    time: '18:00',
    location: 'City Art Gallery',
    userId: '1',
    createdAt: addDays(today, -5).toISOString()
  },
  {
    id: '2',
    title: 'Finalize project proposal',
    description: 'Complete and submit the creative project proposal',
    type: 'task',
    date: addDays(today, 2).toISOString(),
    userId: '1',
    createdAt: addDays(today, -2).toISOString()
  },
  {
    id: '3',
    title: 'Sarah\'s Birthday',
    description: 'Don\'t forget to call and send a gift',
    type: 'birthday',
    date: addDays(today, 5).toISOString(),
    userId: '1',
    createdAt: addDays(today, -10).toISOString()
  }
];

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      const events: Event[] = (data || []).map((e: any) => ({
        id: e.id,
        title: e.titulo,
        description: e.descripcion,
        type: e.tipo,
        date: e.fecha,
        time: e.hora,
        location: e.ubicacion,
        userId: e.usuario_id,
        createdAt: e.creado_en
      }));
      set({ events, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false
      });
    }
  },
  
  addEvent: async (event) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('eventos').insert([
        {
          titulo: event.title,
          descripcion: event.description,
          tipo: event.type,
          fecha_inicio: event.date, // date es ISO string
          hora: event.time, // si existe el campo en la tabla, si no, omitir
          ubicacion: event.location,
          creador_id: event.userId
        }
      ]);
      if (error) throw error;
      await get().fetchEvents();
      toast.success('Evento creado exitosamente!');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create event',
        isLoading: false
      });
      toast.error('Failed to create event');
    }
  },
  
  updateEvent: async (id, eventData) => {
    set({ isLoading: true, error: null });
    try {
      // Actualizar evento en Supabase
      const { error } = await supabase
        .from('eventos')
        .update({
          titulo: eventData.title,
          descripcion: eventData.description,
          tipo: eventData.type,
          fecha_inicio: eventData.date,
          hora: eventData.time,
          ubicacion: eventData.location
        })
        .eq('id', id);
      if (error) throw error;
      await get().fetchEvents();
      set({ isLoading: false });
      toast.success('Evento actualizado exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update event', 
        isLoading: false 
      });
      toast.error('Error al actualizar el evento');
    }
  },
  
  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Eliminar evento en Supabase
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await get().fetchEvents();
      set({ isLoading: false });
      toast.success('Evento eliminado exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete event', 
        isLoading: false 
      });
      toast.error('Error al eliminar el evento');
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