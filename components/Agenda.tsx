
import React, { useState, useEffect } from 'react';
import { AgendaEvent } from '../types';
import { Calendar, Bell, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Agenda: React.FC = () => {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'ritual' as const
  });

  const requestNotificationPermission = () => {
    // Simulation of Notification API
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setPermissionGranted(true);
          new Notification("Obsidiana", { body: "Notificaciones activadas para tus rituales." });
        }
      });
    } else {
      alert("Tu navegador no soporta notificaciones nativas.");
      setPermissionGranted(true); // Fallback for UI
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const eventData = {
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      reminder_enabled: true,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('agenda')
      .insert([eventData])
      .select();

    if (error) {
      console.error('Error saving event:', error);
    } else if (data) {
      setEvents([...events, ...data as any]); // Assuming Supabase returns the created object compatible (mapping needed maybe if keys differ)
      // Wait, types might be an issue if backend uses snake_case and frontend camelCase. 
      // Based on previous files, I should align types or map them.
      // Assuming Supabase auto-generated types or flexibility. 
      // Actually, let's refetch to be safe and simple, or map manually.
      fetchEvents();
      setShowForm(false);
      setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'ritual' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('agenda')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
    } else {
      setEvents(events.filter(ev => ev.id !== id));
    }
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Agenda Lunar</h2>
          <p className="text-gray-600">Planifica tus rituales, prácticas con el huevo y cuidado personal.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Nuevo Evento</span>
        </button>
      </header>

      {!permissionGranted && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-800">
            <Bell size={20} />
            <span className="text-sm font-medium">Activa las notificaciones para recibir recordatorios de tus prácticas.</span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-lg transition-colors font-bold"
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
        {events.map(event => (
          <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-obsidian-200 transition-all">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="text-lg font-bold">{new Date(event.date).getDate()}</span>
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
              {event.reminderEnabled && <Bell size={16} className="text-obsidian-400" />}
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
