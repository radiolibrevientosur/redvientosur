import { HiOutlineUsers, HiOutlineHashtag, HiOutlineCalendar } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { ConversationsList } from '../messages/ConversationsList';
import { useEventStore } from '../../store/eventStore';
import { supabase } from '../../lib/supabase';

function extractHashtags(text: string): string[] {
  if (!text) return [];
  return (text.match(/#[\wáéíóúüñÁÉÍÓÚÜÑ0-9_]+/g) || []).map(t => t.toLowerCase());
}

const RightSidebar: React.FC = () => {
	const [showConversations, setShowConversations] = useState(false);
	const { events, fetchEvents, isLoading } = useEventStore();
	const [onlineUsers, setOnlineUsers] = useState<{ id: string; nombre_usuario: string; avatar_url: string }[]>([]);
	const [trends, setTrends] = useState<string[]>([]);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	useEffect(() => {
		const fetchOnline = async () => {
			const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
			const { data } = await supabase
				.from('usuarios')
				.select('id, nombre_usuario, avatar_url, last_online')
				.not('last_online', 'is', null)
				.gt('last_online', twoMinutesAgo)
				.order('last_online', { ascending: false });
			setOnlineUsers(data || []);
		};
		fetchOnline();
		const interval = setInterval(fetchOnline, 30000); // refresca cada 30s
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// Tendencias reales de los últimos 7 días
		const fetchTrends = async () => {
			const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
			const { data, error } = await supabase
				.from('posts')
				.select('contenido, creado_en')
				.gte('creado_en', since)
				.order('creado_en', { ascending: false });
			if (error) return;
			const hashtagCount: Record<string, number> = {};
			(data || []).forEach((post: any) => {
				extractHashtags(post.contenido).forEach(tag => {
					hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
				});
			});
			const sorted = Object.entries(hashtagCount)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 8)
				.map(([tag]) => tag);
			// Cambia aquí los valores por defecto
			setTrends(sorted.length > 0 ? sorted : ['#redvientosur', '#cultura', '#Moron']);
		};
		fetchTrends();
	}, []);

	const upcomingEvents = events
		.filter(e => new Date(e.date) >= new Date())
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		.slice(0, 5);

	// Handler para seleccionar usuario (puedes personalizar la acción)
	const handleSelectUser = () => {
		// Aquí puedes manejar la selección de usuario/conversación
		setShowConversations(false);
	};

	// Escuchar el evento global para abrir el modal de conversaciones
	useEffect(() => {
		const openModal = () => setShowConversations(true);
		window.addEventListener('openConversationsModal', openModal);
		return () => window.removeEventListener('openConversationsModal', openModal);
	}, []);

	return (
		<>
			{/* Sidebar derecho */}
			<div className="flex flex-col h-full p-4 gap-6 bg-white dark:bg-gray-900 relative hidden lg:block">
				{/* Usuarios en línea */}
				<div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
					<div className="font-semibold mb-2 text-gray-700 dark:text-gray-100 flex items-center gap-2">
						<HiOutlineUsers /> Usuarios en línea
					</div>
					<div className="flex -space-x-2 mb-1">
						{onlineUsers.map((u) => (
							<img
								key={u.id}
								src={u.avatar_url || '/default-avatar.png'}
								alt={u.nombre_usuario}
								className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900"
							/>
						))}
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-300">
						{onlineUsers.length} conectados
					</div>
				</div>
				{/* Eventos próximos */}
				<div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
					<div className="font-semibold mb-2 text-gray-700 dark:text-gray-100 flex items-center gap-2">
						<HiOutlineCalendar /> Eventos próximos
					</div>
					{isLoading ? (
						<div className="text-xs text-gray-400 dark:text-gray-300">Cargando eventos...</div>
					) : (
						<ul className="text-sm text-gray-600 dark:text-gray-200 space-y-1">
							{upcomingEvents.length === 0 ? (
								<li className="text-xs text-gray-400 dark:text-gray-300">No hay eventos próximos</li>
							) : upcomingEvents.map((e) => (
								<li key={e.id} className="flex justify-between">
									<span>{e.title}</span>
									<span className="text-xs text-gray-400 dark:text-gray-300">{new Date(e.date).toLocaleString()}</span>
								</li>
							))}
						</ul>
					)}
				</div>
				{/* Tendencias */}
				<div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
					<div className="font-semibold mb-2 text-gray-700 dark:text-gray-100 flex items-center gap-2">
						<HiOutlineHashtag /> Tendencias
					</div>
					<div className="flex flex-wrap gap-2">
						{trends.map((t, i) => (
							<span
								key={i}
								className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium"
							>
								{t}
							</span>
						))}
					</div>
				</div>
			</div>
			{/* Botón flotante para escribir mensaje, más arriba */}
			<button
				className="fixed right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 transition-all"
				style={{ bottom: '372rem', boxShadow: '0 4px 16px 0 rgba(0,0,0,0.18)' }}
				onClick={() => setShowConversations(true)}
				aria-label="Escribir mensaje"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
					<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.008c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V6.75" />
				</svg>
				<span className="hidden sm:inline font-semibold">Escribir mensaje</span>
			</button>
			{/* Modal de conversaciones flotante */}
			{showConversations && (
				<div className="fixed inset-0 z-50 flex items-start justify-end pointer-events-none">
					<div
						className="absolute inset-0 bg-black bg-opacity-40 pointer-events-auto"
						onClick={() => setShowConversations(false)}
					/>
					<aside
						className="relative mt-8 mr-8 w-[min(22rem,90vw)] max-w-full h-[80vh] bg-white dark:bg-gray-900 shadow-2xl rounded-xl z-50 flex flex-col pointer-events-auto border dark:border-gray-800 animate-fade-in transition-transform duration-300"
						style={{ minWidth: '18rem', transform: showConversations ? 'translateY(0)' : 'translateY(100%)' }}
					>
						{/* Barra para arrastrar/minimizar */}
						<div
							className="w-full flex justify-center items-center cursor-pointer py-2"
							onClick={() => setShowConversations(false)}
						>
							<div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
						</div>
						<ConversationsList onSelectUser={handleSelectUser} />
					</aside>
				</div>
			)}
		</>
	);
};

export default RightSidebar;
