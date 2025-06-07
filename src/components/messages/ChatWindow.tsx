import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDirectMessages, Message } from '../../hooks/useDirectMessages';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import AudioRecorder from '../ui/AudioRecorder';
import { Mic, MoreVertical, Image as ImageIcon, Music, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ChatWindowProps {
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ otherUserId, otherUserName, otherUserAvatar }) => {
  const { user } = useAuthStore();
  const { messages, fetchMessages, sendMessage, loading } = useDirectMessages(user?.id || '');
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<any>(null);
  const [isMicPressed, setIsMicPressed] = useState(false);

  // Variables para gestos
  const micStartPos = useRef<{ x: number; y: number } | null>(null);
  const [dragAction, setDragAction] = useState<'none' | 'left' | 'up'>('none');

  // Umbrales de gesto (ajustables)
  const DRAG_LEFT_THRESHOLD = 60; // px
  const DRAG_UP_THRESHOLD = 60; // px

  useEffect(() => {
    if (user?.id && otherUserId) fetchMessages(otherUserId);
  }, [user, otherUserId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !audioUrl) || loading) return;
    if (audioUrl) {
      await sendMessage(otherUserId, audioUrl); // solo dos argumentos
      setAudioUrl(null);
    } else {
      await sendMessage(otherUserId, input.trim());
    }
    setInput('');
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(input + (emoji.native || ''));
    setShowEmojiPicker(false);
  };

  const handleAudioReady = (url: string | null) => {
    if (url) {
      setAudioUrl(url);
      setInput('');
    }
    setShowAudioRecorder(false); // Solo cerrar el modal cuando el usuario decida (enviar o descartar)
  };

  const handleFileSelect = (type: 'media' | 'music' | 'doc') => {
    if (type === 'media') fileInputRef.current?.click();
    if (type === 'music') musicInputRef.current?.click();
    if (type === 'doc') docInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'music' | 'doc') => {
    const file = e.target.files?.[0];
    setShowOptions(false);
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const folder = type === 'media' ? 'chat-media' : type === 'music' ? 'chat-music' : 'chat-docs';
      const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(filePath, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      await sendMessage(otherUserId, urlData.publicUrl);
      toast.success('Archivo enviado');
    } catch (err) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (musicInputRef.current) musicInputRef.current.value = '';
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // Handlers de gestos para micrófono
  const handleMicDown = (e: React.MouseEvent | React.TouchEvent) => {
    setShowAudioRecorder(true);
    setIsMicPressed(true);
    setDragAction('none');
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    micStartPos.current = { x: clientX, y: clientY };
    setTimeout(() => {
      audioRecorderRef.current?.startRecording();
    }, 50);
  };

  const handleMicMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMicPressed || !micStartPos.current) return;
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const dx = clientX - micStartPos.current.x;
    const dy = clientY - micStartPos.current.y;
    if (dx < -DRAG_LEFT_THRESHOLD) {
      setDragAction('left');
    } else if (dy < -DRAG_UP_THRESHOLD) {
      setDragAction('up');
    } else {
      setDragAction('none');
    }
  };

  // Feedback visual del gesto (opcional, puedes personalizar)
  const renderMicGestureHint = () => {
    if (!isMicPressed) return null;
    if (dragAction === 'left') {
      return <span className="absolute left-0 bottom-14 text-xs bg-red-600 text-white px-2 py-1 rounded shadow animate-shake">Desliza a la izquierda para cancelar</span>;
    }
    if (dragAction === 'up') {
      return <span className="absolute right-0 bottom-14 text-xs bg-blue-600 text-white px-2 py-1 rounded shadow animate-bounce">Desliza hacia arriba para previsualizar</span>;
    }
    return <span className="absolute bottom-14 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded shadow">Suelta para enviar</span>;
  };

  const handleMicUp = () => {
    setIsMicPressed(false);
    if (dragAction === 'left') {
      audioRecorderRef.current?.cancelRecording();
    } else if (dragAction === 'up') {
      // Solo mostrar previsualización si hay audio grabado
      if (audioRecorderRef.current?.isRecording?.()) {
        audioRecorderRef.current?.stopRecording();
        setTimeout(() => {
          if (audioRecorderRef.current?.showPreview) {
            audioRecorderRef.current.showPreview();
          }
        }, 250);
      } else if (audioRecorderRef.current?.showPreview) {
        audioRecorderRef.current.showPreview();
      }
    } else {
      audioRecorderRef.current?.stopRecording();
    }
    setDragAction('none');
    micStartPos.current = null;
  };

  const handleMicLeaveOrCancel = () => {
    setIsMicPressed(false);
    audioRecorderRef.current?.cancelRecording();
    setDragAction('none');
    micStartPos.current = null;
  };

  return (
    <div className="flex flex-col h-full border rounded shadow bg-white">
      <div className="p-2 border-b font-semibold flex items-center gap-2">
        {otherUserAvatar && (
          <img src={otherUserAvatar} alt={otherUserName || otherUserId} className="w-8 h-8 rounded-full" />
        )}
        Chat con {otherUserName || otherUserId}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {loading ? (
          <div>Cargando mensajes...</div>
        ) : (
          messages.map((msg: Message) => {
            // Detectar si el mensaje es un archivo adjunto (url de supabase)
            const isFile = msg.content && msg.content.startsWith('http');
            let filePreview = null;
            if (isFile) {
              const url = msg.content;
              if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                filePreview = <img src={url} alt="imagen adjunta" className="max-w-[180px] max-h-40 rounded mb-1" />;
              } else if (url.match(/\.(mp4|webm|mov)$/i)) {
                filePreview = <video src={url} controls className="max-w-[180px] max-h-40 rounded mb-1" />;
              } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
                filePreview = <audio src={url} controls className="w-full my-1" />;
              } else {
                filePreview = <a href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-200 underline break-all mb-1">Documento adjunto</a>;
              }
            }
            return (
              <div
                key={msg.id}
                className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow-md ${msg.sender_id === user?.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-white mr-auto'}`}
              >
                {isFile ? filePreview : msg.content}
                <div className="text-[10px] text-gray-300 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString()}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-2 border-t flex gap-2 items-center relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={e => handleFileUpload(e, 'media')}
          disabled={uploading}
        />
        <input
          ref={musicInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => handleFileUpload(e, 'music')}
          disabled={uploading}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={e => handleFileUpload(e, 'doc')}
          disabled={uploading}
        />
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-100 text-xl"
          aria-label="Más opciones"
          onClick={() => setShowOptions(v => !v)}
          tabIndex={-1}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {showOptions && (
          <div className="absolute bottom-12 left-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[180px] animate-fade-in">
            <button type="button" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleFileSelect('media')}>
              <ImageIcon className="w-5 h-5 text-blue-500" /> Foto/Video
            </button>
            <button type="button" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleFileSelect('music')}>
              <Music className="w-5 h-5 text-green-500" /> Música
            </button>
            <button type="button" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleFileSelect('doc')}>
              <FileText className="w-5 h-5 text-yellow-500" /> Documento
            </button>
          </div>
        )}
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-100 text-xl"
          aria-label="Emojis"
          onClick={() => setShowEmojiPicker(v => !v)}
          tabIndex={-1}
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-12 z-50">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
          </div>
        )}
        <input
          className="flex-1 border rounded px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        {input.trim() ? (
          <button type="submit" className="bg-blue-700 text-white px-4 py-1 rounded hover:bg-blue-800 transition">Enviar</button>
        ) : (
          <div className="relative">
            <button
              type="button"
              className={`p-2 rounded hover:bg-gray-100 text-xl ${isMicPressed ? 'bg-red-100' : ''}`}
              aria-label="Grabar audio"
              onMouseDown={handleMicDown}
              onTouchStart={handleMicDown}
              onMouseMove={handleMicMove}
              onTouchMove={handleMicMove}
              onMouseUp={handleMicUp}
              onTouchEnd={handleMicUp}
              onMouseLeave={handleMicLeaveOrCancel}
              onTouchCancel={handleMicLeaveOrCancel}
              tabIndex={-1}
            >
              <Mic className="w-5 h-5" />
            </button>
            {renderMicGestureHint()}
          </div>
        )}
        {showAudioRecorder && (
          <div className="absolute bottom-12 right-0 z-50 w-72 max-w-full">
            <AudioRecorder ref={audioRecorderRef} onAudioReady={handleAudioReady} folder="chat-audio" />
          </div>
        )}
      </form>
    </div>
  );
};
