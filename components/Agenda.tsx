
import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { Calendar, Bell, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';

const MOCK_EVENTS: AgendaEvent[] = [
  {
    id: '1',
    title: 'Meditación Luna Nueva',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    type: 'ritual',
    reminderEnabled: true
  },
  {
    id: '2',
    title: 'Ginecólogo (Revisión)',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    time: '10:00',
    type: 'medical',
    reminderEnabled: true
  }
];

const Agenda: React.FC = () => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => {
    const saved = localStorage.getItem('obsidiana_agenda');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });
  const [showForm, setShowForm] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    localStorage.setItem('obsidiana_agenda', JSON.stringify(events));
  }, [events]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'ritual' as const
  });

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setPermissionGranted(true);
          new Notification("Obsidiana", { body: "Notificaciones activadas para tus rituales." });
        }
      });
    } else {
      alert("Tu navegador no soporta notificaciones nativas.");
      setPermissionGranted(true);
    }
  };

  const generateGoogleUrl = (event: AgendaEvent) => {
    const base = "https://www.google.com/calendar/render?action=TEMPLATE";

    // Función para formatear a YYYYMMDDTHHMMSSZ (UTC)
    const formatToGoogleISO = (dateStr: string, timeStr: string, addHours = 0) => {
      const date = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(date.getTime())) return '';
      if (addHours) date.setHours(date.getHours() + addHours);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatToGoogleISO(event.date, event.time);
    const end = formatToGoogleISO(event.date, event.time, 1);

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`Ritual de Obsidiana - Tipo: ${event.type}\nSincronizado desde tu Agenda Lunar.`);
    const location = encodeURIComponent("Espacio Sagrado / Hogar");

    return `${base}&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const handleExportICal = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Obsidiana//Agenda Lunar//ES\nCALSCALE:GREGORIAN\n";

    events.forEach(event => {
      const dateStr = event.date.replace(/-/g, '');
      const timeStr = event.time.replace(/:/g, '') + '00';
      const start = `${dateStr}T${timeStr}`;
      const [h, m] = event.time.split(':').map(Number);
      const endH = (h + 1).toString().padStart(2, '0');
      const end = `${dateStr}T${endH}${m.toString().padStart(2, '0')}00`;

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `DESCRIPTION:Ritual de Obsidiana - Tipo: ${event.type}\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'agenda_obsidiana.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: AgendaEvent = {
      id: Date.now().toString(),
      ...newEvent,
      type: newEvent.type as 'ritual' | 'medical' | 'practice' | 'other',
      reminderEnabled: true
    };
    setEvents([...events, event]);
    setShowForm(false);
    setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'ritual' });
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(ev => ev.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ritual': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'medical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'practice': return 'bg-obsidian-100 text-obsidian-800 border-obsidian-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Agenda Lunar</h2>
          <p className="text-gray-600">Sincroniza tus rituales con tus ciclos biológicos y celestes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const nextEvent = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
              if (nextEvent) {
                window.open(generateGoogleUrl(nextEvent), '_blank');
              } else {
                alert("Primero crea un evento para sincronizarlo.");
              }
            }}
            title="Añadir el próximo evento a Google Calendar"
            className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Añadir a Google Calendar</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </header>

      {!permissionGranted && (
        <div className="glass p-4 rounded-xl flex items-center justify-between border border-obsidian-200">
          <div className="flex items-center space-x-3 text-obsidian-800">
            <div className="p-2 bg-obsidian-100 rounded-full animate-pulse">
              <Bell size={18} />
            </div>
            <span className="text-sm font-medium">¿Deseas recibir recordatorios de tus prácticas sagradas?</span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="text-xs bg-obsidian-600 hover:bg-obsidian-700 text-white px-4 py-2 rounded-lg transition-colors font-bold uppercase tracking-wider"
          >
            Activar
          </button>
        </div>
      )}

      {/* Add Event Form */}
      {showForm && (
        <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 mb-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título del Evento</label>
              <input
                required
                type="text"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-100 outline-none text-gray-900 bg-white"
                placeholder="Ej. Inserción del Huevo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
              <input
                required
                type="date"
                style={{ colorScheme: 'light' }}
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-100 outline-none text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
              <input
                required
                type="time"
                style={{ colorScheme: 'light' }}
                value={newEvent.time}
                onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-100 outline-none text-gray-900 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Evento</label>
              <div className="flex space-x-4">
                {['ritual', 'medical', 'practice', 'other'].map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={newEvent.type === type}
                      onChange={() => setNewEvent({ ...newEvent, type: type as any })}
                      className="text-obsidian-600 focus:ring-obsidian-500"
                    />
                    <span className="capitalize text-sm text-gray-700">{type === 'medical' ? 'Médico' : type === 'practice' ? 'Práctica' : type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-obsidian-600 text-white rounded-lg hover:bg-obsidian-700">Guardar</button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
          <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-obsidian-200 transition-all">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="text-lg font-bold">{new Date(event.date).getDate() + 1}</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{event.title}</h4>
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center"><Clock size={12} className="mr-1" /> {event.time}</span>
                  <span className={`px-2 py-0.5 rounded-full border ${getTypeColor(event.type)} capitalize`}>
                    {event.type === 'medical' ? 'Médico' : event.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={generateGoogleUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                title="Añadir a Google Calendar"
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </a>
              <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>No tienes eventos programados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
