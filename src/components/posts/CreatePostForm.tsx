import React, { useState, useRef, useEffect } from 'react';
import { FileText, Mic, Send, Camera, Paperclip, Image, Music, Video } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PostType, usePostStore } from '../../store/postStore';
import { toast } from 'sonner';
import FileUploadWithPreview from '../ui/FileUploadWithPreview';
import AudioRecorder from '../ui/AudioRecorder';
import VideoRecorder from '../ui/VideoRecorder';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { supabase } from '../../lib/supabase';
import MediaCarousel, { MediaItem } from './subcomponents/MediaCarousel';
import LinkPreview, { LinkData } from './subcomponents/LinkPreview';
import Poll, { PollData } from './subcomponents/Poll';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<Array<{ url: string; type: string; name: string }>>([]);
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const audioRecorderRef = useRef<any>(null);
  const videoRecorderRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachType, setAttachType] = useState<'media' | 'music' | 'document' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<Array<{ url: string; type: string; name: string }>>([]);
  const [modalText, setModalText] = useState('');
  const [showModalEmojiPicker, setShowModalEmojiPicker] = useState(false);

  // Estado para encuestas
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollQuestion, setPollQuestion] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  // Estado para fondo de color
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);
  // Estado para preview de link enriquecido
  const [linkData, setLinkData] = useState<LinkData | null>(null);

  const { user } = useAuthStore();
  const { addPost } = usePostStore();

  // Cambia el submit para enviar todos los archivos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para crear una publicación');
      return;
    }
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error('Por favor, agrega contenido o un archivo');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPost({
        userId: user.id,
        type: postType,
        content: content.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined, // Ahora es array
        isFavorite: false
      });
      setContent('');
      setMediaUrls([]);
      setPostType('text');
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
    setMediaUrls(fileUrl ? [{ url: fileUrl, type: 'document', name: '' }] : []);
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
    if (showMicModal) {
      setAudioPreviewUrl(audioUrl);
      setIsRecording(false);
      setShowMicRecordingAnim(false);
    } else {
      setMediaUrls(audioUrl ? [{ url: audioUrl, type: 'audio', name: '' }] : []);
      setPostType(audioUrl ? 'audio' : 'text');
      setShowAudioRecorder(false);
      setIsRecording(false);
    }
  };

  // Nuevo handler para integración con VideoRecorder
  const handleVideoReady = (videoUrl: string | null) => {
    setMediaUrls(videoUrl ? [{ url: videoUrl, type: 'video', name: '' }] : []);
    setPostType(videoUrl ? 'video' : 'text');
    setShowVideoRecorder(false);
  };

  // Nuevo estado para el modal de grabación de voz
  const [showMicModal, setShowMicModal] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  // Estado para animación de grabación en el modal
  const [showMicRecordingAnim, setShowMicRecordingAnim] = useState(false);

  // Handlers para grabación tipo WhatsApp
  const handleMicPress = () => {
    setShowMicModal(true);
    setAudioPreviewUrl(null);
    setTimeout(() => {
      audioRecorderRef.current?.startRecording();
      setIsRecording(true);
    }, 100);
  };
  // Nuevo: manejar el press dentro del modal
  const handleMicModalPress = () => {
    setAudioPreviewUrl(null);
    setShowMicRecordingAnim(true);
    setTimeout(() => {
      audioRecorderRef.current?.startRecording();
      setIsRecording(true);
    }, 100);
  };
  const handleMicModalRelease = () => {
    if (isRecording) {
      audioRecorderRef.current?.stopRecording();
      setIsRecording(false);
      setShowMicRecordingAnim(false);
    }
  };
  const handleMicModalCancel = () => {
    if (isRecording) {
      audioRecorderRef.current?.cancelRecording();
      setIsRecording(false);
    }
    setShowMicModal(false);
    setAudioPreviewUrl(null);
    setShowMicRecordingAnim(false);
  };

  // Estado para el modal de cámara y previsualización
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState<string | null>(null);
  const [cameraPreviewType, setCameraPreviewType] = useState<'image' | 'video' | null>(null);
  const [showVideoRecorderInModal, setShowVideoRecorderInModal] = useState(false);
  // Estado para el input file de cámara
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // Estado para tipo de captura en el modal de cámara
  const [cameraCaptureType, setCameraCaptureType] = useState<'image' | 'video' | null>(null);

  // Handler para abrir el input file de cámara según tipo
  const handleOpenCameraPhoto = () => {
    setCameraCaptureType('image');
    setTimeout(() => cameraInputRef.current?.click(), 100);
  };
  const handleOpenCameraVideo = () => {
    setCameraCaptureType('video');
    setTimeout(() => cameraInputRef.current?.click(), 100);
  };

  // Handler para cuando el usuario toma foto o graba video
  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      setCameraPreviewUrl(url);
      setCameraPreviewType('image');
    } else if (file.type.startsWith('video/')) {
      setCameraPreviewUrl(url);
      setCameraPreviewType('video');
    }
    setShowVideoRecorderInModal(false);
  };

  // Handler para mostrar el modal de cámara
  const handleCameraButtonClick = () => {
    setShowCameraModal(true);
    setCameraPreviewUrl(null);
    setCameraPreviewType(null);
    setShowVideoRecorderInModal(false);
  };

  // Handler para subir el video/foto
  const handleUploadCameraMedia = async () => {
    if (cameraPreviewUrl && cameraPreviewType) {
      setIsSubmitting(true);
      try {
        // Subir archivo a Supabase Storage y obtener URL pública
        const response = await fetch(cameraPreviewUrl);
        const blob = await response.blob();
        const ext = cameraPreviewType === 'image' ? 'jpg' : 'mp4';
        const filePath = `posts/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('media').upload(filePath, blob);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        setMediaUrls([{ url: urlData.publicUrl, type: cameraPreviewType, name: '' }]);
        setPostType(cameraPreviewType);
        setShowCameraModal(false);
        setCameraPreviewUrl(null);
        setCameraPreviewType(null);
      } catch (err) {
        toast.error('Error al subir archivo de cámara');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  const handleCancelCameraModal = () => {
    setShowCameraModal(false);
    setCameraPreviewUrl(null);
    setCameraPreviewType(null);
    setShowVideoRecorderInModal(false);
  };

  const handleEmojiSelect = (emoji: any) => {
    setContent(content + (emoji.native || emoji.skins?.[0]?.native || ''));
    setShowEmojiPicker(false);
  };

  // Nuevo handler para adjuntar
  const handleAttachClick = () => {
    setShowAttachModal(true);
    setAttachType(null);
  };
  const handleAttachType = (type: 'media' | 'music' | 'document') => {
    setAttachType(type);
    setTimeout(() => fileInputRef.current?.click(), 200);
  };
  // Modifica handleAttachFile para permitir múltiples archivos
  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length + previewFiles.length > 10) {
      toast.error('Solo puedes adjuntar hasta 10 archivos.');
      return;
    }
    const newFiles = Array.from(files).map(file => {
      const url = URL.createObjectURL(file);
      let type = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      return { url, type, name: file.name };
    });
    // Validar duración de video si es video
    newFiles.forEach(file => {
      if (file.type === 'video') {
        const video = document.createElement('video');
        video.src = file.url;
        video.onloadedmetadata = () => {
          if (video.duration > 90) {
            toast.error('El video no puede durar más de 90 segundos.');
          }
        };
      }
    });
    setPreviewFiles(prev => [...prev, ...newFiles]);
    setShowPreviewModal(true);
    setShowAttachModal(false);
    setAttachType(null);
  };
  // Eliminar archivo del modal
  const handleRemovePreviewFile = (idx: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== idx));
  };
  // Agregar emoji al texto del modal
  const handleModalEmojiSelect = (emoji: any) => {
    setModalText(modalText + (emoji.native || emoji.skins?.[0]?.native || ''));
    setShowModalEmojiPicker(false);
  };
  // Handler para confirmar adjunto múltiple
  const handleConfirmPreview = async () => {
    if (previewFiles.length > 0) {
      setIsSubmitting(true);
      try {
        // Subir todos los archivos a Supabase Storage y obtener URLs públicas
        const uploadedFiles = await Promise.all(previewFiles.map(async (file) => {
          // Si la url ya es pública (ya subida), la dejamos
          if (file.url.startsWith('https://')) return file;
          // Si es un blob local, subimos
          const response = await fetch(file.url);
          const blob = await response.blob();
          const ext = file.name.split('.').pop();
          const filePath = `posts/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const { error } = await supabase.storage.from('media').upload(filePath, blob);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
          return { ...file, url: urlData.publicUrl };
        }));
        setMediaUrls(uploadedFiles);
        setPostType(uploadedFiles[0].type as PostType);
        setContent(modalText);
      } catch (err) {
        toast.error('Error al subir archivos adjuntos');
      } finally {
        setIsSubmitting(false);
        setShowPreviewModal(false);
        setPreviewFiles([]);
        setModalText('');
      }
    } else {
      setShowPreviewModal(false);
      setPreviewFiles([]);
      setModalText('');
    }
  };
  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewFiles([]);
    setModalText('');
  };

  // Reordenamiento drag & drop en el modal de previsualización
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('drag-idx', idx.toString());
  };
  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('drag-idx'));
    if (fromIdx === idx) return;
    setPreviewFiles(prev => {
      const files = [...prev];
      const [removed] = files.splice(fromIdx, 1);
      files.splice(idx, 0, removed);
      return files;
    });
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handler para enviar el audio grabado desde el modal
  const handleUploadAudioFromModal = () => {
    if (audioPreviewUrl) {
      setMediaUrls([{ url: audioPreviewUrl, type: 'audio', name: '' }]);
      setPostType('audio');
      setShowMicModal(false);
      setAudioPreviewUrl(null);
    }
  };

  // Detectar enlaces y obtener preview enriquecido (mock, deberías usar un fetch real)
  useEffect(() => {
    const urlMatch = content.match(/(https?:\/\/[\w\-\.\/\?#&=;%+~]+)|(www\.[\w\-\.\/\?#&=;%+~]+)/gi);
    if (urlMatch && urlMatch[0]) {
      // Aquí deberías hacer un fetch a un API de link preview
      setLinkData({
        url: urlMatch[0],
        image: '/vite.svg',
        title: 'Título de ejemplo',
        description: 'Descripción de ejemplo',
      });
    } else {
      setLinkData(null);
    }
  }, [content]);

  return (
    <div className="feed-item mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-none sm:rounded-lg mx-0 sm:mx-auto p-0 sm:p-0">
      {/* Modal flotante de grabación de voz */}
      {showMicModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center gap-4 relative animate-slide-up">
            {/* Mantén el botón cancelar de la esquina superior */}
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={handleMicModalCancel}>&times;</button>
            <h3 className="text-lg font-bold mb-2">Grabar nota de voz</h3>
            {/* Si hay audio grabado, mostrar reproductor y subir/cancelar */}
            {audioPreviewUrl ? (
              <>
                <audio src={audioPreviewUrl} controls autoPlay className="w-full my-2" />
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 rounded-full mt-2"
                  onClick={handleUploadAudioFromModal}
                >Enviar</button>
                {/* Elimina el botón cancelar debajo del reproductor */}
              </>
            ) : (
              <>
                <AudioRecorder ref={audioRecorderRef} onAudioReady={handleAudioReady} />
                <button
                  type="button"
                  className="btn btn-danger px-4 py-2 rounded-full mt-4"
                  onClick={() => audioRecorderRef.current?.stopRecording()}
                  disabled={isSubmitting}
                >Detener</button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal de cámara */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center gap-4 relative animate-slide-up">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={handleCancelCameraModal}>&times;</button>
            <h3 className="text-lg font-bold mb-2">Cámara</h3>
            {/* Si hay previsualización, mostrarla con subir/cancelar */}
            {cameraPreviewUrl ? (
              <>
                {cameraPreviewType === 'video' ? (
                  <video src={cameraPreviewUrl} controls autoPlay className="w-full my-2 rounded-lg" />
                ) : cameraPreviewType === 'image' ? (
                  <img src={cameraPreviewUrl} alt="Previsualización" className="w-full my-2 rounded-lg" />
                ) : null}
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 rounded-full mt-2"
                  onClick={handleUploadCameraMedia}
                >Subir</button>
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2 rounded-full mt-2"
                  onClick={handleCancelCameraModal}
                >Cancelar</button>
              </>
            ) : (
              <>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="relative p-6 rounded-full bg-blue-100 text-blue-600 shadow-lg border-4 border-blue-300 focus:outline-none transition-all duration-200 flex flex-col items-center"
                    onClick={handleOpenCameraPhoto}
                    aria-label="Tomar foto"
                    disabled={isSubmitting}
                  >
                    <Camera className="h-10 w-10 relative z-10" />
                    <span className="text-xs mt-1">Foto</span>
                  </button>
                  <button
                    type="button"
                    className="relative p-6 rounded-full bg-blue-100 text-blue-600 shadow-lg border-4 border-blue-300 focus:outline-none transition-all duration-200 flex flex-col items-center"
                    onClick={handleOpenCameraVideo}
                    aria-label="Grabar video"
                    disabled={isSubmitting}
                  >
                    <Camera className="h-10 w-10 relative z-10" />
                    <span className="text-xs mt-1">Video</span>
                  </button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={cameraCaptureType === 'image' ? 'image/*' : cameraCaptureType === 'video' ? 'video/*' : ''}
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleCameraFileChange}
                />
              </>
            )}
          </div>
        </div>
      )}
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
              className="flex-1 p-4 text-lg text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm resize-none min-h-[48px] max-h-[160px] transition-all placeholder-gray-400 dark:placeholder-gray-500"
              rows={2}
              aria-label="Contenido de la publicación"
              required={!mediaUrls.length}
              disabled={isSubmitting}
              style={{height: 'auto', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)', backgroundColor: backgroundColor || undefined}}
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
          {/* Botón clip para archivos: ahora abre modal de opciones */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 mr-1"
            onClick={handleAttachClick}
            aria-label="Adjuntar archivo"
            disabled={isSubmitting}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          {/* Espacio flexible para empujar los botones a la derecha */}
          <div className="flex-1" />
          {/* Botón micrófono o enviar, cambia según contenido */}
          {content.trim() || mediaUrls.length > 0 ? (
            <button 
              type="submit"
              disabled={isSubmitting || (!content.trim() && mediaUrls.length === 0)}
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
            // Botón micrófono ahora abre el modal
            <button
              type="button"
              className={`relative p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ml-1 transition-all duration-200`}
              onClick={handleMicPress}
              aria-label="Grabar nota de voz"
              disabled={isSubmitting}
            >
              <Mic className="h-5 w-5 relative z-10" />
            </button>
          )}
          {/* Botón cámara ahora solo abre el modal de cámara */}
          <button
            type="button"
            className={`p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ml-1`}
            onClick={handleCameraButtonClick}
            aria-label="Abrir cámara"
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
            className="fixed left-12 bottom-8 z-50 animate-slide-down shadow-2xl rounded-2xl bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-700"
          >
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
          </div>
        )}
        {/* Modal de adjuntar */}
        {showAttachModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center gap-4 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowAttachModal(false)}>&times;</button>
              <h3 className="text-lg font-bold mb-2">¿Qué quieres adjuntar?</h3>
              <div className="flex flex-col gap-3 w-full">
                <button type="button" className="w-full flex items-center gap-2 justify-center rounded-full py-2 text-base font-semibold bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-700 shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors text-primary-700 dark:text-primary-200" onClick={() => handleAttachType('media')}><Image className="h-5 w-5" /> Foto/Video</button>
                <button type="button" className="w-full flex items-center gap-2 justify-center rounded-full py-2 text-base font-semibold bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-700 shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors text-primary-700 dark:text-primary-200" onClick={() => handleAttachType('music')}><Music className="h-5 w-5" /> Música</button>
                <button type="button" className="w-full flex items-center gap-2 justify-center rounded-full py-2 text-base font-semibold bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-700 shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors text-primary-700 dark:text-primary-200" onClick={() => handleAttachType('document')}><FileText className="h-5 w-5" /> Documento</button>
              </div>
              {/* Input file oculto, cambia accept según tipo */}
              <input
                ref={fileInputRef}
                type="file"
                accept={attachType === 'media' ? 'image/*,video/*' : attachType === 'music' ? 'audio/*' : attachType === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv' : '*/*'}
                style={{ display: 'none' }}
                onChange={handleAttachFile}
              />
            </div>
          </div>
        )}
        {/* Modal de previsualización de archivos adjuntos personalizado */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md flex flex-col items-center gap-4 relative animate-slide-up">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={handleCancelPreview}>&times;</button>
              <h3 className="text-lg font-bold mb-2">Previsualización de archivos</h3>
              <div className="w-full flex flex-wrap gap-3 items-center justify-center">
                {previewFiles.map((file, idx) => (
                  <div key={file.url} className="relative group" draggable onDragStart={handleDragStart(idx)} onDrop={handleDrop(idx)} onDragOver={handleDragOver}>
                    {file.type === 'image' && (
                      <img src={file.url} alt="Previsualización" className="rounded-lg max-h-32 max-w-[120px] object-contain border cursor-move" />
                    )}
                    {file.type === 'video' && (
                      <video src={file.url} controls className="rounded-lg max-h-32 max-w-[120px] object-contain border cursor-move" />
                    )}
                    {file.type === 'audio' && (
                      <audio src={file.url} controls className="w-28" />
                    )}
                    {file.type === 'document' && (
                      <div className="flex flex-col items-center w-28">
                        <FileText className="h-8 w-8 text-primary-500 mb-1" />
                        <span className="text-xs text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                      </div>
                    )}
                    <button type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100" onClick={() => handleRemovePreviewFile(idx)} title="Eliminar archivo">&times;</button>
                  </div>
                ))}
                {/* Botón para agregar más archivos */}
                <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-primary-300 rounded-lg p-4 hover:bg-primary-50 dark:hover:bg-gray-800 transition-colors">
                  <Paperclip className="h-6 w-6 text-primary-500 mb-1" />
                  <span className="text-xs text-primary-700 dark:text-primary-200">Agregar más</span>
                  <input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv" className="hidden" onChange={handleAttachFile} />
                </label>
              </div>
              {/* Textarea y emojis */}
              <div className="w-full mt-2">
                <div className="flex items-center mb-2">
                  <button type="button" className="p-1 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={() => setShowModalEmojiPicker(v => !v)} aria-label="Insertar emoji">
                    😊
                  </button>
                </div>
                <textarea
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none min-h-[48px]"
                  placeholder="Escribe un mensaje para acompañar tus archivos..."
                  value={modalText}
                  onChange={e => setModalText(e.target.value)}
                />
                {showModalEmojiPicker && (
                  <div className="absolute z-50 mt-2">
                    <Picker data={data} onEmojiSelect={handleModalEmojiSelect} theme="auto" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-primary px-4 py-2 rounded-full" onClick={handleConfirmPreview} disabled={previewFiles.length === 0}>Adjuntar</button>
                <button type="button" className="btn btn-secondary px-4 py-2 rounded-full" onClick={handleCancelPreview}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {/* Muestra el carrusel de medios si hay archivos en previewFiles */}
        {previewFiles.length > 0 && (
          <div className="px-4 py-2">
            <MediaCarousel media={previewFiles as MediaItem[]} />
          </div>
        )}
        {/* Muestra la encuesta si está activa y tiene al menos 2 opciones */}
        {showPoll && pollOptions.filter(opt => opt.trim()).length >= 2 && pollQuestion.trim() && (
          <Poll poll={{ question: pollQuestion, options: pollOptions.map((text, i) => ({ id: String(i), text, votes: 0 })), totalVotes: 0 }} onVote={() => {}} />
        )}
        {/* Preview de link enriquecido si hay un enlace en el contenido */}
        {linkData && <LinkPreview link={linkData} />}
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
