import React, { useState, useRef } from 'react';
import { FileText, Mic, Send, Camera } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PostType, usePostStore } from '../../store/postStore';
import { toast } from 'sonner';
import FileUploadWithPreview from '../ui/FileUploadWithPreview';
import AudioRecorder from '../ui/AudioRecorder';
import VideoRecorder from '../ui/VideoRecorder';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const audioRecorderRef = useRef<any>(null);
  const videoRecorderRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const { user } = useAuthStore();
  const { addPost } = usePostStore();

  // Limpiar estados tras publicar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para crear una publicación');
      return;
    }
    if (!content.trim() && !mediaUrl) {
      toast.error('Por favor, agrega contenido o un archivo');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPost({
        userId: user.id,
        type: postType,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        isFavorite: false
      });
      setContent('');
      setMediaUrl('');
      setPostType('text');
      setPreviewUrl(null);
      setAudioPreviewUrl(null);
      toast.success('¡Publicación creada exitosamente!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error al crear la publicación');
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nuevo handler para integración con FileUploadWithPreview
  const handleFileSelect = (fileUrl: string | null) => {
    setMediaUrl(fileUrl || '');
    if (fileUrl) {
      // Detectar tipo por extensión
      if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) setPostType('image');
      else if (fileUrl.match(/\.(mp4|webm|mov)$/i)) setPostType('video');
      else if (fileUrl.match(/\.(mp3|wav|ogg)$/i)) setPostType('audio');
      else setPostType('document');
    } else {
      setPostType('text');
    }
  };

  // Nuevo handler para integración con AudioRecorder
  const handleAudioReady = (audioUrl: string | null) => {
    setMediaUrl(audioUrl || '');
    setPostType(audioUrl ? 'audio' : 'text');
    setShowAudioRecorder(false); // Cierra el modal de grabación y previsualización al adjuntar el audio
    setIsRecording(false);
  };

  // Nuevo handler para integración con VideoRecorder
  const handleVideoReady = (videoUrl: string | null) => {
    setMediaUrl(videoUrl || '');
    setPostType(videoUrl ? 'video' : 'text');
    setShowVideoRecorder(false);
  };

  // Handlers para grabación tipo WhatsApp
  const handleMicPress = () => {
    setShowAudioRecorder(true);
    setShowFileUpload(false);
    setShowVideoRecorder(false);
    setIsRecording(true);
    if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
    setTimeout(() => {
      audioRecorderRef.current?.startRecording();
    }, 50); // pequeño delay para asegurar montaje
  };
  const handleMicRelease = () => {
    if (isRecording) {
      audioRecorderRef.current?.stopRecording();
      setIsRecording(false);
    }
  };
  const handleMicCancel = () => {
    if (isRecording) {
      audioRecorderRef.current?.cancelRecording();
      setIsRecording(false);
    }
  };

  const handleCameraPress = () => {
    setShowVideoRecorder(true);
    setShowFileUpload(false);
    setShowAudioRecorder(false);
    setTimeout(() => {
      videoRecorderRef.current?.startRecording();
    }, 50);
  };
  const handleCameraRelease = () => {
    videoRecorderRef.current?.stopRecording();
  };
  const handleCameraCancel = () => {
    videoRecorderRef.current?.cancelRecording();
  };

  const handleEmojiSelect = (emoji: any) => {
    setContent(content + (emoji.native || emoji.skins?.[0]?.native || ''));
    setShowEmojiPicker(false);
  };

  // Cerrar menú al hacer clic fuera
  type PlusMenuRefType = HTMLDivElement | null;
  const plusMenuRef = useRef<PlusMenuRefType>(null);
  React.useEffect(() => {
    if (!showPlusMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu]);

  // Cerrar menú al hacer clic fuera (emoji picker)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  return (
    <div className="feed-item mb-4">
      <form onSubmit={handleSubmit}>
        {/* Contenido superior (avatar y preview) */}
        <div className="p-4 pb-2">
          <div className="flex items-start space-x-3">
            <div className="avatar">
              <img 
                src={user?.avatar} 
                alt={user?.displayName} 
                className="avatar-img"
              />
            </div>
            <textarea
              placeholder={`Hola ${user?.displayName || ''} ¿Qué está pasando?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-4 text-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm resize-none min-h-[48px] max-h-[160px] transition-all placeholder-gray-400 dark:placeholder-gray-500"
              rows={2}
              aria-label="Contenido de la publicación"
              required={!mediaUrl}
              disabled={isSubmitting}
              style={{height: 'auto', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'}}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        </div>
        {/* Barra inferior tipo Telegram */}
        <div className="px-4 py-2 flex items-end border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl">
          {/* Botón emoji */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 mr-1"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Insertar emoji"
            disabled={isSubmitting}
          >
            <span role="img" aria-label="emoji">😊</span>
          </button>
          {/* Botón clip para archivos */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 mr-1"
            onClick={() => { setShowFileUpload((v) => !v); setShowAudioRecorder(false); setShowVideoRecorder(false); }}
            aria-label="Adjuntar archivo"
            disabled={isSubmitting}
          >
            <FileText className="h-5 w-5" />
          </button>
          {/* Espacio flexible para empujar los botones a la derecha */}
          <div className="flex-1" />
          {/* Botón micrófono o enviar, cambia según contenido */}
          {content.trim() || mediaUrl ? (
            <button 
              type="submit"
              disabled={isSubmitting || (!content.trim() && !mediaUrl)}
              className="btn btn-primary p-2 rounded-full flex items-center justify-center ml-1"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loader h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          ) : (
            // 1. Animación visual del botón de micrófono
            // Cambia el color y agrega animación de círculo creciente durante la grabación
            <button
              type="button"
              className={`relative p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ml-1 transition-all duration-200
                ${showAudioRecorder ? 'bg-red-200 text-red-600 ring-4 ring-red-400/30 animate-pulse' : ''}`}
              onMouseDown={handleMicPress}
              onMouseUp={handleMicRelease}
              onMouseLeave={handleMicCancel}
              onTouchStart={handleMicPress}
              onTouchEnd={handleMicRelease}
              onTouchCancel={handleMicCancel}
              aria-label="Grabar nota de voz"
              disabled={isSubmitting}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
              )}
              <Mic className="h-5 w-5 relative z-10" />
            </button>
          )}
          {/* Botón cámara opcional, puedes dejarlo si lo usas mucho */}
          <button
            type="button"
            className={`p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ml-1 ${showVideoRecorder ? 'bg-blue-200 text-blue-600' : ''}`}
            onMouseDown={handleCameraPress}
            onMouseUp={handleCameraRelease}
            onMouseLeave={handleCameraCancel}
            onTouchStart={handleCameraPress}
            onTouchEnd={handleCameraRelease}
            onTouchCancel={handleCameraCancel}
            aria-label="Grabar nota de video"
            disabled={isSubmitting}
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
        {/* Subida de archivos con previsualización y progreso, solo si showFileUpload */}
        {showFileUpload && (
          <div className="px-4 pb-2">
            <FileUploadWithPreview onFileSelect={handleFileSelect} />
          </div>
        )}
        {/* Grabación de voz controlada por ref, solo si showAudioRecorder */}
        {showAudioRecorder && (
          <div className="px-4 pb-2">
            <AudioRecorder ref={audioRecorderRef} onAudioReady={handleAudioReady} />
            {isRecording && (
              <div className="text-red-600 font-bold mt-2 flex items-center gap-2">
                <Mic className="h-4 w-4 animate-pulse" /> Grabando... Suelta para enviar, desliza fuera para cancelar
              </div>
            )}
          </div>
        )}
        {/* Grabación de video controlada por ref, solo si showVideoRecorder */}
        {showVideoRecorder && (
          <div className="px-4 pb-2">
            <VideoRecorder ref={videoRecorderRef} onVideoReady={handleVideoReady} />
            <div className="text-blue-600 font-bold mt-2 flex items-center gap-2">
              <Camera className="h-4 w-4 animate-pulse" /> Grabando video... Suelta para enviar, desliza fuera para cancelar
            </div>
          </div>
        )}
        {/* Selector de emoji */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="fixed left-12 bottom-8 z-50 animate-slide-down shadow-2xl rounded-2xl bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-700"
          >
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePostForm;

/* Agrega la animación slide-up en tu CSS/tailwind:
@keyframes slide-up {
  0% { opacity: 0; transform: translateY(16px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slide-up {
  animation: slide-up 0.18s cubic-bezier(0.4,0,0.2,1);
}
*/