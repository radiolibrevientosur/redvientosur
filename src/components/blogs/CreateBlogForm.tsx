import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface CreateBlogFormProps {
  onSuccess?: () => void;
}

const CreateBlogForm: React.FC<CreateBlogFormProps> = ({ onSuccess }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploadProgress(0);
    // Simulación de progreso
    const fakeProgress = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(fakeProgress);
          return p;
        }
        return p + 10;
      });
    }, 100);
    const ext = file.name.split('.').pop();
    const filePath = `blog-covers/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(filePath, file);
    clearInterval(fakeProgress);
    setUploadProgress(100);
    if (error) {
      toast.error('Error al subir la imagen');
      return;
    }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    setCoverImage(urlData.publicUrl);
    toast.success('Imagen subida correctamente');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para publicar un blog');
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('publicaciones').insert({
        autor_id: user.id,
        titulo: title.trim(),
        contenido: content.trim(),
        excerpt: excerpt.trim() || content.substring(0, 120),
        imagen_portada: coverImage,
        categoria: category,
        publicado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        tipo: 'blog'
      });
      if (error) throw error;
      toast.success('¡Blog publicado exitosamente!');
      setTitle('');
      setExcerpt('');
      setContent('');
      setCoverImage('');
      setPreviewUrl(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Error al publicar el blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Título *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input w-full"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block font-medium">Resumen</label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          className="input w-full"
          rows={2}
          maxLength={120}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block font-medium">Contenido *</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input w-full"
          rows={6}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block font-medium">Imagen de portada</label>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
        {previewUrl && (
          <div className="mt-2 relative rounded-lg overflow-hidden">
            <img src={previewUrl} alt="Previsualización" className="w-full max-h-48 object-cover rounded-lg" />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary-100">
                <div className="h-2 bg-primary-600" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            <button type="button" onClick={() => { setPreviewUrl(null); setCoverImage(''); }} className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full">✕</button>
          </div>
        )}
      </div>
      <div>
        <label className="block font-medium">Categoría</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input w-full" disabled={isSubmitting}>
          <option value="General">General</option>
          <option value="Arte">Arte</option>
          <option value="Música">Música</option>
          <option value="Cine">Cine</option>
          <option value="Danza">Danza</option>
          <option value="Literatura">Literatura</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary flex items-center"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <span className="loader mr-2"></span>
        ) : null}
        {isSubmitting ? 'Publicando...' : 'Publicar blog'}
      </button>
    </form>
  );
};

export default CreateBlogForm;
