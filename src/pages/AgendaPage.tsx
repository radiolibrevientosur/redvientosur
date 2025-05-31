import React, { useEffect, useState } from "react";
import EventoCulturalCard from "../components/cultural/EventoCulturalCard";
import CumpleañosCard from "../components/cultural/CumpleañosCard";
import { TareaCulturalKanban } from "../components/cultural/TareaCulturalKanban";
import { supabase } from "../lib/supabase";
import { Search } from 'lucide-react';

const AgendaPage: React.FC = () => {
  const [eventos, setEventos] = useState<any[]>([]);
  const [cumpleanos, setCumpleanos] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    // Cargar eventos culturales
    const fetchEventos = async () => {
      setLoadingEventos(true);
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      setEventos(data || []);
      setLoadingEventos(false);
    };
    fetchEventos();
  }, []);

  useEffect(() => {
    // Cargar próximos cumpleaños (por ejemplo, próximos 30 días)
    const fetchCumpleanos = async () => {
      setLoadingCumpleanos(true);
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + 30);
      const { data } = await supabase
        .from('cumpleanos')
        .select('*')
        .gte('fecha_nacimiento', today.toISOString().slice(0, 10))
        .lte('fecha_nacimiento', future.toISOString().slice(0, 10))
        .order('fecha_nacimiento', { ascending: true });
      setCumpleanos(data || []);
      setLoadingCumpleanos(false);
    };
    fetchCumpleanos();
  }, []);

  // Filtrar eventos por búsqueda y fecha
  // const eventosFiltrados = eventos.filter(event => {
  //   const matchNombre = event.titulo?.toLowerCase().includes(search.toLowerCase());
  //   const matchFecha = filterDate ? format(new Date(event.fecha_inicio), 'yyyy-MM-dd') === filterDate : true;
  //   return matchNombre && matchFecha;
  // });

  // Unificar feed de cumpleaños y eventos
  const feed = [
    ...cumpleanos.map(c => ({
      ...c,
      __type: 'cumple',
      fecha: c.fecha_nacimiento
    })),
    ...eventos.map(e => ({
      ...e,
      __type: 'evento',
      fecha: e.fecha_inicio
    }))
  ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Actualiza un cumpleaños editado en el array sin recargar todo
  const handleCumpleEdited = (cumpleActualizado: any) => {
    setCumpleanos(prev => prev.map(c => c.id === cumpleActualizado.id ? { ...c, ...cumpleActualizado } : c));
  };

  // Actualiza un evento editado en el array sin recargar todo
  const handleEventoEdited = (eventoActualizado: any) => {
    setEventos(prev => prev.map(e => e.id === eventoActualizado.id ? { ...e, ...eventoActualizado } : e));
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agenda</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar evento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition shadow-sm"
              aria-label="Buscar evento"
            />
          </div>
          <div className="relative w-full md:w-1/3">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition shadow-sm"
              aria-label="Filtrar por fecha"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/></svg>
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => window.location.href = '/calendar'}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Programar evento"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
            Programar
          </button>
        </div>
      </div>
      <section aria-labelledby="feed" className="mb-8">
        <h2 id="feed" className="text-xl font-semibold mb-4">Próximos eventos y cumpleaños</h2>
        {loadingEventos || loadingCumpleanos ? (
          <div>Cargando...</div>
        ) : feed.length === 0 ? (
          <div>No hay eventos ni cumpleaños próximos.</div>
        ) : (
          feed.map(item =>
            item.__type === 'cumple' ? (
              <CumpleañosCard
                key={item.id}
                birthday={item}
                onDeleted={() => setCumpleanos(prev => prev.filter(c => c.id !== item.id))}
                onEdit={handleCumpleEdited}
              />
            ) : (
              <EventoCulturalCard
                key={item.id}
                event={item}
                onDeleted={() => setEventos(prev => prev.filter(e => e.id !== item.id))}
                onEdit={handleEventoEdited}
              />
            )
          )
        )}
      </section>
      <section aria-labelledby="tareas" className="mb-8">
        <h2 id="tareas" className="text-xl font-semibold mb-4">Tareas</h2>
        <TareaCulturalKanban />
      </section>
    </main>
  );
};

export default AgendaPage;