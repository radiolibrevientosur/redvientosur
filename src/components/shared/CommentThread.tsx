import React, { useState, useEffect } from 'react';
import { reportContent } from '../../lib/report';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

// Tipos base para comentarios anidados
export interface CommentData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  replies?: CommentData[];
  canEdit?: boolean;
  canDelete?: boolean;
}

interface CommentThreadProps {
  comments: CommentData[];
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
}

// Mejoras móviles y responsivas en el hilo de comentarios
// - Inputs y botones más grandes y cómodos
// - Espaciado y scroll adecuado
// - Evita desbordes horizontales
// - Mejora visual para pantallas pequeñas
const CommentThread: React.FC<CommentThreadProps> = ({ comments, onReply, onEdit, onDelete, currentUserId }) => {
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [recentlyDeletedId, setRecentlyDeletedId] = useState<string | null>(null);
  const user = useAuthStore.getState().user;
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [customReportReason, setCustomReportReason] = useState('');

  // Detectar comentarios nuevos para animación
  useEffect(() => {
    if (comments.length === 0) return;
    const ids = comments.map(c => c.id);
    setRecentlyAddedIds(ids.slice(-3)); // Resalta los 3 últimos (ajustable)
  }, [comments]);

  // Función para renderizar comentarios recursivamente
  const renderComments = (comments: CommentData[], parentId: string | null = null) => {
    return comments
      .filter(c => (c as any).parent_id === parentId)
      .map(comment => (
        <div
          key={comment.id}
          className={`border rounded-lg p-3 bg-white dark:bg-gray-900 mt-2 max-w-full sm:max-w-2xl mx-auto overflow-x-auto transition-all duration-300 ease-in-out
            ${recentlyAddedIds.includes(comment.id) ? 'animate-fade-in ring-2 ring-primary-300/60 bg-primary-50/60 dark:bg-primary-900/30' : ''}
            ${recentlyDeletedId === comment.id ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
          style={{
            opacity: recentlyDeletedId === comment.id ? 0 : 1,
            transform: recentlyDeletedId === comment.id ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <img src={comment.userAvatar || '/default-avatar.png'} alt={comment.userName} className="w-8 h-8 rounded-full flex-shrink-0" />
            <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-none">{comment.userName}</span>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 break-words">
            {editingId === comment.id ? (
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  className="flex-1 border rounded px-2 py-2 text-sm min-w-0 max-w-full"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  maxLength={300}
                  style={{ minWidth: 0 }}
                />
                <button className="text-primary-600 font-bold text-xs py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" onClick={() => handleEditSave(comment)}>Guardar</button>
                <button className="text-xs text-gray-400 py-2 px-3 rounded" onClick={handleEditCancel}>Cancelar</button>
              </div>
            ) : (
              <span>{comment.content}</span>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {comment.canEdit && (
              <button className="text-xs text-gray-500 hover:text-primary-500 py-1 px-2 rounded" onClick={() => handleEdit(comment)}>Editar</button>
            )}
            {comment.canDelete && (
              <button className="text-xs text-red-500 hover:underline py-1 px-2 rounded" onClick={() => handleDeleteWithAnimation(comment.id)}>Eliminar</button>
            )}
            {onReply && (
              <button className="text-xs text-blue-500 hover:underline py-1 px-2 rounded" onClick={() => setReplyingId(comment.id)}>Responder</button>
            )}
            <button className="text-xs text-orange-500 hover:underline py-1 px-2 rounded" onClick={() => setReportingId(comment.id)}>Reportar</button>
          </div>
          {/* Formulario de respuesta */}
          {replyingId === comment.id && (
            <form className="mt-2 flex gap-2 flex-wrap" onSubmit={e => {
              e.preventDefault();
              if (onReply && replyText.trim()) {
                if (replyText.length < 3) {
                  toast.error('El comentario es demasiado corto.');
                  return;
                }
                if (isOffensive(replyText)) {
                  toast.error('El comentario contiene palabras no permitidas.');
                  return;
                }
                onReply(comment.id, replyText.trim());
                setReplyText('');
                setReplyingId(null);
              }
            }}>
              <input
                className="flex-1 border rounded px-2 py-2 text-sm min-w-0 max-w-full"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                maxLength={300}
                placeholder="Escribe una respuesta..."
                style={{ minWidth: 0 }}
              />
              <button type="submit" className="text-primary-600 font-bold text-xs py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">Publicar</button>
              <button type="button" className="text-xs text-gray-400 py-2 px-3 rounded" onClick={() => setReplyingId(null)}>Cancelar</button>
            </form>
          )}
          {/* Modal de reporte */}
          {reportingId === comment.id && (
            <div className="mt-2 p-2 border rounded bg-orange-50 dark:bg-orange-900/20">
              <div className="mb-2 text-xs">Motivo del reporte:</div>
              <select
                className="border rounded px-2 py-1 text-xs w-full mb-2"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              >
                <option value="">Selecciona un motivo</option>
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {reportReason === 'Otro' && (
                <input
                  className="border rounded px-2 py-1 text-xs w-full mb-2"
                  value={customReportReason}
                  onChange={e => setCustomReportReason(e.target.value)}
                  placeholder="Describe el motivo (opcional)"
                  maxLength={200}
                />
              )}
              <div className="flex gap-2">
                <button className="text-xs text-orange-600 font-bold py-1 px-2 rounded bg-orange-100 hover:bg-orange-200" onClick={() => handleReport(comment.id)} disabled={!reportReason || (reportReason === 'Otro' && !customReportReason.trim())}>Enviar</button>
                <button className="text-xs text-gray-400 py-1 px-2 rounded" onClick={() => setReportingId(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {/* Renderizar respuestas recursivamente */}
          <div className="ml-4 sm:ml-6 mt-2 border-l-2 border-gray-100 dark:border-gray-800 pl-2 sm:pl-4">
            {renderComments(comments, comment.id)}
          </div>
        </div>
      ));
  };

  // Estados y funciones de edición (igual que antes)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const handleEdit = (comment: CommentData) => {
    setEditingId(comment.id);
    setEditingText(comment.content);
  };
  const handleEditSave = (comment: CommentData) => {
    if (onEdit && editingText.trim()) {
      if (editingText.length < 3) {
        toast.error('El comentario es demasiado corto.');
        return;
      }
      if (isOffensive(editingText)) {
        toast.error('El comentario contiene palabras no permitidas.');
        return;
      }
      onEdit(comment.id, editingText.trim());
      setEditingId(null);
      setEditingText('');
    }
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteWithAnimation = (commentId: string) => {
    setRecentlyDeletedId(commentId);
    setTimeout(() => {
      if (onDelete) onDelete(commentId);
      setRecentlyDeletedId(null);
    }, 350); // Duración de la animación
  };

  const handleReport = async (commentId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para reportar.');
      return;
    }
    if (!reportReason.trim()) {
      toast.error('Indica el motivo del reporte.');
      return;
    }
    await reportContent({
      type: 'comment',
      contentId: commentId,
      reason: reportReason,
      userId: user.id
    });
    toast.success('Comentario reportado. ¡Gracias por tu ayuda!');
    setReportingId(null);
    setReportReason('');
    setCustomReportReason('');
  };

  // Lista simple de palabras prohibidas (puedes ampliar)
  const BAD_WORDS = ['tonto', 'idiota', 'estúpido', 'imbécil', 'puta', 'mierda', 'spam', 'http://', 'https://'];
  function isOffensive(text: string) {
    const lower = text.toLowerCase();
    return BAD_WORDS.some(w => lower.includes(w));
  }

  const REPORT_REASONS = [
    'Incitación al odio',
    'Mentira o información falsa',
    'Ofensivo',
    'Spam',
    'Otro'
  ];

  return <div className="space-y-4">{renderComments(comments)}</div>;
};

export default CommentThread;
