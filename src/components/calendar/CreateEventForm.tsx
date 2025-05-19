import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckSquare, Cake, X } from 'lucide-react';
import { EventType, useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';

interface CreateEventFormProps {
  date: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

const eventTypeOptions: { value: EventType; label: string; icon: React.ReactNode }[] = [
  { value: 'event', label: 'Event', icon: <Calendar className="h-4 w-4" /> },
  { value: 'task', label: 'Task', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'birthday', label: 'Birthday', icon: <Cake className="h-4 w-4" /> }
];

const CreateEventForm: React.FC<CreateEventFormProps> = ({ date, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addEvent } = useEventStore();
  const { user } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await addEvent({
        title: title.trim(),
        description: description.trim(),
        type,
        date: date.toISOString(),
        time: time || undefined,
        location: location.trim() || undefined,
        userId: user.id
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="card mt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create {type} on {format(date, 'MMM d, yyyy')}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Event Type Selection */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {eventTypeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={`
                flex items-center justify-center p-2 rounded-lg border
                ${type === option.value 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <div className="flex flex-col items-center">
                {React.cloneElement(option.icon as React.ReactElement, { 
                  className: `h-5 w-5 ${type === option.value ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`
                })}
                <span className="text-xs mt-1">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title*
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder={`Enter ${type} title`}
            required
          />
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Add details"
          />
        </div>
        
        {/* Time (for events) */}
        {type === 'event' && (
          <div className="mb-4">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
            />
          </div>
        )}
        
        {/* Location (for events) */}
        {type === 'event' && (
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="Add location"
            />
          </div>
        )}
        
        {/* Submit */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="btn btn-primary px-4 py-2"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;