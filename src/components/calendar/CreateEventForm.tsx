import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageUpload } from '../ui/ImageUpload';
import { CalendarDays, Users, Tags, FileText, Phone, AtSign, DollarSign, RefreshCw, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const CATEGORIES = [
  'CINE Y MEDIOS AUDIOVISUALES',
  'ARTES VISUALES',
  'ARTES ESCÉNICAS Y MUSICALES',
  'PROMOCIÓN DEL LIBRO Y LA LECTURA',
  'PATRIMONIO CULTURAL',
  'ECONOMÍA CULTURAL',
  'OTROS'
] as const;

const EVENT_TYPES: Record<typeof CATEGORIES[number], string[]> = {
  'CINE Y MEDIOS AUDIOVISUALES': ['cine foro', 'proyección de cine', 'radio', 'realización audiovisual'],
  'ARTES VISUALES': ['dibujo y pintura', 'escultura', 'fotografía', 'constructivismo', 'arte conceptual', 'muralismo'],
  'ARTES ESCÉNICAS Y MUSICALES': ['teatro', 'danza', 'música', 'circo'],
  'PROMOCIÓN DEL LIBRO Y LA LECTURA': ['creación y expresividad literaria', 'promoción de lectura', 'club de libros'],
  'PATRIMONIO CULTURAL': ['historia local', 'historia general', 'costumbres y tradiciones', 'cultura popular', 'identidad cultural'],
  'ECONOMÍA CULTURAL': ['industrias culturales', 'proyectos culturales', 'portafolios culturales (emprendimientos)', 'finanzas culturales'],
  'OTROS': []
};

const recurrenceSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().optional(),
  end_date: z.string().optional(),
  days_of_week: z.array(z.number().min(0).max(6)).optional(),
});

const eventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  category: z.enum(CATEGORIES),
  event_type: z.string().min(1, 'Selecciona un tipo de evento'),
  date: z.string().min(1, 'La fecha es requerida'),
  location: z.string().min(3, 'La ubicación es requerida'),
  target_audience: z.enum(['Infantil', 'Adultos', 'Todos']),
  cost: z.object({
    type: z.enum(['free', 'paid']),
    amount: z.number().optional()
  }),
  responsible_person: z.object({
    name: z.string().min(3, 'El nombre es requerido'),
    phone: z.string().min(6, 'El teléfono es requerido'),
    social_media: z.string().optional()
  }),
  technical_requirements: z.array(z.string()).default([]),
  image_url: z.string().optional(),
  tags: z.array(z.string()).default([]),
  recurrence: recurrenceSchema.default({ type: 'none' })
});

interface CreateEventFormProps {
  date: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ date, onSuccess, onCancel }) => {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number] | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      date: date.toISOString().split('T')[0],
      cost: { type: 'free' },
      technical_requirements: [],
      tags: [],
      recurrence: { type: 'none' }
    }
  });

  const costType = watch('cost.type');
  const recurrenceType = watch('recurrence.type');
  const category = watch('category');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as typeof CATEGORIES[number];
    setSelectedCategory(newCategory);
    setValue('category', newCategory);
    setValue('event_type', '');
  };

  const uploadImage = async (file: File) => {
    const fileName = `events/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('event_images')
      .upload(fileName, file);

    if (error) {
      toast.error('Error al subir la imagen');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('event_images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const onSubmit = async (formData: z.infer<typeof eventSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: eventError } = await supabase
        .from('eventos')
        .insert({
          creador_id: userData.user.id,
          titulo: formData.title,
          descripcion: formData.description,
          tipo: formData.event_type,
          categoria: formData.category,
          fecha_inicio: new Date(formData.date).toISOString(),
          ubicacion: formData.location,
          imagen_url: formData.image_url,
          estado: 'publicado',
          precio: formData.cost.type === 'paid' ? formData.cost.amount : 0,
          metadata: {
            target_audience: formData.target_audience,
            responsible_person: formData.responsible_person,
            technical_requirements: formData.technical_requirements,
            tags: formData.tags,
            recurrence: formData.recurrence
          }
        });

      if (eventError) throw eventError;

      toast.success('Evento creado exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error al crear evento:', error);
      toast.error('Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (file: File | undefined) => {
    if (!file) {
      setValue('image_url', undefined);
      return;
    }
    
    const imageUrl = await uploadImage(file);
    if (imageUrl) setValue('image_url', imageUrl);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium mb-1">Título del Evento</label>
          <input
            type="text"
            {...register('title')}
            className="input w-full"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Categoría y Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              {...register('category')}
              onChange={handleCategoryChange}
              className="input w-full"
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Evento</label>
            <select
              {...register('event_type')}
              className="input w-full"
              disabled={!category}
            >
              <option value="">Selecciona un tipo</option>
              {category && EVENT_TYPES[category].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.event_type && (
              <p className="text-red-500 text-sm mt-1">{errors.event_type.message}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            {...register('description')}
            rows={4}
            className="input w-full"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Fecha y Ubicación */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              {...register('date')}
              className="input w-full"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ubicación</label>
            <input
              type="text"
              {...register('location')}
              className="input w-full"
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* Público Objetivo */}
        <div>
          <label className="block text-sm font-medium mb-1">Público Objetivo</label>
          <select
            {...register('target_audience')}
            className="input w-full"
          >
            <option value="Todos">Todos</option>
            <option value="Infantil">Infantil</option>
            <option value="Adultos">Adultos</option>
          </select>
          {errors.target_audience && (
            <p className="text-red-500 text-sm mt-1">{errors.target_audience.message}</p>
          )}
        </div>

        {/* Costo */}
        <div>
          <label className="block text-sm font-medium mb-1">Costo</label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('cost.type')}
                value="free"
                className="form-radio"
              />
              <span className="ml-2">Gratuito</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('cost.type')}
                value="paid"
                className="form-radio"
              />
              <span className="ml-2">Pagado</span>
            </label>
          </div>
          {costType === 'paid' && (
            <input
              type="number"
              {...register('cost.amount', { valueAsNumber: true })}
              placeholder="Monto"
              className="input mt-2 w-full"
            />
          )}
        </div>

        {/* Responsable */}
        <div className="space-y-4">
          <h3 className="font-medium">Persona Responsable</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                {...register('responsible_person.name')}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                {...register('responsible_person.phone')}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Redes Sociales</label>
            <input
              type="text"
              {...register('responsible_person.social_media')}
              className="input w-full"
              placeholder="@usuario"
            />
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium mb-1">Imagen del Evento</label>
          <ImageUpload
            onChange={handleImageChange}
            className="w-full"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Creando...' : 'Crear Evento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;