import { create } from 'zustand';
import { toast } from 'sonner';
import { addDays, format, parse, startOfToday } from 'date-fns';

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, fetch events from API
      set({ events: INITIAL_EVENTS, isLoading: false });
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newEvent: Event = {
        ...event,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString()
      };
      
      set(state => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
      
      toast.success('Event created successfully!');
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set(state => ({
        events: state.events.map(event => 
          event.id === id ? { ...event, ...eventData } : event
        ),
        isLoading: false
      }));
      
      toast.success('Event updated successfully!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update event', 
        isLoading: false 
      });
      toast.error('Failed to update event');
    }
  },
  
  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set(state => ({
        events: state.events.filter(event => event.id !== id),
        isLoading: false
      }));
      
      toast.success('Event deleted successfully!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete event', 
        isLoading: false 
      });
      toast.error('Failed to delete event');
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