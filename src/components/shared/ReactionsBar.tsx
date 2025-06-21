import React from 'react';
import { reportContent } from '../../lib/report';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export interface ReactionOption {
  emoji: string;
  label: string;
}

export interface ReactionData {
  emoji: string;
  count: number;
  reacted: boolean;
  id?: string; // id de la reacción en la base de datos (opcional para reportar)
}

interface ReactionsBarProps {
  reactions: ReactionData[];
  options?: ReactionOption[];
  onReact: (emoji: string) => void;
  reactionKind?: 'post' | 'blog' | 'evento' | 'cumpleanos'; // añadido 'cumpleanos'
}

const defaultOptions: ReactionOption[] = [
  { emoji: '❤️', label: 'Me gusta' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Divertido' },
  { emoji: '😮', label: 'Sorprende' },
  { emoji: '😢', label: 'Triste' },
];

const REPORT_REASONS = [
  'Incitación al odio',
  'Mentira o información falsa',
  'Ofensivo',
  'Spam',
  'Otro'
];

interface ReactionsBarReportProps {
  reactionId: string;
  reactionKind: 'post' | 'blog' | 'evento' | 'cumpleanos'; // añadido 'cumpleanos'
}

const ReactionsBarReport: React.FC<ReactionsBarReportProps> = ({ reactionId, reactionKind }) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [customReason, setCustomReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const user = useAuthStore.getState().user;

  if (!user) return null;

  const handleReport = async () => {
    setLoading(true);
    const motivo = reason === 'Otro' ? customReason : reason;
    const { error } = await reportContent({
      type: 'reaction',
      contentId: reactionId,
      reason: motivo,
      userId: user.id,
      reactionKind: reactionKind as any // forzar tipo para incluir 'cumpleanos'
    });
    setLoading(false);
    setOpen(false);
    setReason('');
    setCustomReason('');
    if (error) {
      toast.error('No se pudo enviar el reporte.');
    } else {
      toast.success('¡Reporte enviado!');
    }
  };

  return (
    <>
      <button
        className="ml-1 text-xs text-red-500 hover:underline"
        onClick={() => setOpen(true)}
        aria-label="Reportar reacción"
        type="button"
      >
        Reportar
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-xl w-80">
            <h3 className="font-bold mb-2">Reportar reacción</h3>
            <div className="mb-2">
              <label className="block text-sm mb-1">Motivo:</label>
              <select
                className="w-full border rounded p-2"
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={loading}
              >
                <option value="">Selecciona un motivo</option>
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {reason === 'Otro' && (
              <textarea
                className="w-full border rounded p-2 mb-2"
                placeholder="Describe el motivo (opcional)"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                rows={2}
                disabled={loading}
              />
            )}
            <div className="flex gap-2 justify-end">
              <button className="text-gray-500" onClick={() => setOpen(false)} disabled={loading}>Cancelar</button>
              <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleReport} disabled={loading || !reason || (reason === 'Otro' && !customReason.trim())}>
                {loading ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ReactionsBar: React.FC<ReactionsBarProps> = ({ reactions, options = defaultOptions, onReact, reactionKind }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  // El corazón siempre es el primero
  const main = options[0];
  const mainData = reactions.find(r => r.emoji === main.emoji);
  const rest = options.slice(1);

  // Cerrar el menú al hacer clic fuera
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded-full border text-base transition-all min-w-[44px] min-h-[40px] sm:text-sm sm:px-2 sm:py-1 ${mainData?.reacted ? 'bg-primary-100 border-primary-400' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'}`}
        onClick={() => setOpen(v => !v)}
        aria-label={main.label}
        type="button"
        style={{ touchAction: 'manipulation' }}
      >
        <span className="text-xl sm:text-base">{main.emoji}</span>
        <span className="font-medium">{mainData?.count || 0}</span>
      </button>
      {/* Reacciones desplegables */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          {rest.map(opt => {
            const data = reactions.find(r => r.emoji === opt.emoji);
            return (
              <div key={opt.emoji} className="flex flex-col items-center">
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-full border text-base transition-all min-w-[44px] min-h-[40px] sm:text-sm sm:px-2 sm:py-1 ${data?.reacted ? 'bg-primary-100 border-primary-400' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'}`}
                  onClick={() => { onReact(opt.emoji); setOpen(false); }}
                  aria-label={opt.label}
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-xl sm:text-base">{opt.emoji}</span>
                  <span className="font-medium">{data?.count || 0}</span>
                </button>
                {/* Botón de reportar reacción */}
                {data && data.count > 0 && reactionKind && (
                  <ReactionsBarReport reactionId={data.id || ''} reactionKind={reactionKind} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReactionsBar;
