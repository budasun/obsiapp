import React, { useState, useEffect } from 'react';
import { UserProfile, MiracleQuestion } from '../types';
import { MIRACLE_QUESTIONS, PHASE_DETAILS } from '../constants';
import { getMiracleFeedback } from '../services/aiService'; // Ajusta a tu servicio de IA
import { Sparkles, Droplet, Calendar, Hourglass, RotateCw, MapPin, Send, Loader2, Wand2, Info, ChevronDown, ChevronUp, Zap, Activity, Moon as MoonIcon, FileText, X, ChevronLeft, PenTool } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { getMoonPhaseData, MoonPhaseVisual } from '../utils/moonUtils';
import { useApp } from '../context/AppContext';

interface DashboardProps {
  user: UserProfile;
}

// COMPONENTE: CALENDARIO PREDICTIVO CON MENÚ RÁPIDO
const CycleCalendar: React.FC<{ lastPeriod: Date, cycleLength: number, onUpdatePeriod: (date: Date) => void }> = ({ lastPeriod, cycleLength, onUpdatePeriod }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estado para controlar qué vista del modal estamos viendo ('menu' = acciones rápidas, 'form' = formulario de diario)
  const [menuView, setMenuView] = useState<'menu' | 'form'>('menu');

  const [notes, setNotes] = useState<Record<string, { text: string, mood?: string, pain?: number, hasFlow?: boolean }>>(() => {
    const saved = localStorage.getItem('obsidiana_calendar_notes');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const migrated: Record<string, { text: string }> = {};
    Object.keys(parsed).forEach(key => {
      if (typeof parsed[key] === 'string') {
        migrated[key] = { text: parsed[key] };
      } else {
        migrated[key] = parsed[key];
      }
    });
    return migrated;
  });

  useEffect(() => {
    localStorage.setItem('obsidiana_calendar_notes', JSON.stringify(notes));
  }, [notes]);

  const handleUpdateDayData = (date: Date, updates: Partial<{ text: string, mood: string, pain: number, hasFlow: boolean }>) => {
    const dateKey = date.toDateString();
    const current = notes[dateKey] || { text: '' };
    const newData = { ...current, ...updates };

    if (!newData.text.trim() && !newData.mood && newData.pain === undefined && newData.hasFlow === undefined) {
      const newNotes = { ...notes };
      delete newNotes[dateKey];
      setNotes(newNotes);
    } else {
      setNotes({ ...notes, [dateKey]: newData });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = date.toDateString();
    const existingData = notes[dateKey];

    // Si ya existe texto, ánimo o dolor, abrimos directamente el formulario de la nota
    const hasActualNote = existingData && (existingData.text || existingData.mood || existingData.pain !== undefined);

    setMenuView(hasActualNote ? 'form' : 'menu');
  };

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
  }

  const getDayStatus = (date: Date) => {
    if (!date) return null;
    const diffTime = date.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycleDay = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
    const dateKey = date.toDateString();
    const manualFlow = notes[dateKey]?.hasFlow;

    if (manualFlow === true) return 'menstrual';

    if (cycleDay <= 6) {
      if (manualFlow === false) return 'follicular';

      let endedEarly = false;
      for (let i = 1; i < cycleDay; i++) {
        const pastDate = new Date(date.getTime() - ((cycleDay - i) * 24 * 60 * 60 * 1000));
        if (notes[pastDate.toDateString()]?.hasFlow === false) {
          endedEarly = true;
          break;
        }
      }

      if (endedEarly) return 'follicular';
      return 'menstrual';
    }

    if (cycleDay >= 7 && cycleDay <= 13) return 'follicular';
    if (cycleDay >= 14 && cycleDay <= 20) return 'ovulatory';
    return 'luteal';
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className={`mt-6 pt-6 border-t border-gray-100 transition-all duration-500`}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Calendario Predictivo</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md transition-colors font-bold"
        >
          {isExpanded ? 'OCULTAR' : 'AMPLIAR'}
        </button>
      </div>

      {isExpanded && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronUp className="-rotate-90" size={18} />
            </button>
            <span className="text-lg font-bold font-serif text-obsidian-900">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronUp className="rotate-90" size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
              <div key={d} className="text-xs font-bold text-gray-400 mb-2">{d}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const status = getDayStatus(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const dateKey = date.toDateString();
              const noteData = notes[dateKey];

              // Solo mostramos el punto amarillo si hay texto, ánimo o dolor (no si solo ajustó el sangrado)
              const hasNote = noteData && (noteData.text || noteData.mood || noteData.pain !== undefined);
              const isSelected = selectedDate?.toDateString() === dateKey;

              let bgColor = 'transparent';
              if (status === 'menstrual') bgColor = '#be185d';
              if (status === 'follicular') bgColor = '#10b981';
              if (status === 'ovulatory') bgColor = '#0ea5e9';
              if (status === 'luteal') bgColor = '#8b5cf6';

              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(date)}
                  className={`relative h-12 flex flex-col items-center justify-center text-sm rounded-xl transition-all hover:bg-gray-50 border border-transparent ${isToday ? 'ring-2 ring-obsidian-300 ring-offset-1 font-bold' : ''} ${isSelected ? 'border-obsidian-300 shadow-sm scale-110 z-10 bg-white' : ''}`}
                  style={{ backgroundColor: bgColor !== 'transparent' ? `${bgColor}15` : 'transparent' }}
                >
                  <span className={`${status === 'menstrual' ? 'text-pink-600 font-bold' : 'text-gray-700'} ${isSelected ? 'text-obsidian-900 font-bold' : ''}`}>{date.getDate()}</span>
                  <div className="flex gap-1 mt-1">
                    {status === 'menstrual' && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />}
                    {hasNote && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* POPUP / MODAL DEL DÍA SELECCIONADO */}
          {selectedDate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-gray-50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col border border-gray-200">

                <div className="p-6 overflow-y-auto">
                  {/* VISTA 1: Menú Rápido */}
                  {menuView === 'menu' && (
                    <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                        <span className="text-sm font-bold text-gray-800 font-serif capitalize">
                          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 bg-white rounded-md shadow-sm border border-gray-100">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            onUpdatePeriod(selectedDate);
                            setSelectedDate(null);
                          }}
                          className="w-full flex items-center p-3 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 transition-all text-pink-700 group shadow-sm"
                        >
                          <div className="bg-pink-100 p-2 rounded-lg group-hover:scale-110 transition-transform mr-3">
                            <Droplet size={16} className="fill-pink-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm">Día 1 del ciclo</p>
                            <p className="text-[10px] text-pink-500">Marcar como inicio de menstruación</p>
                          </div>
                        </button>

                        {getDayStatus(selectedDate) === 'menstrual' ? (
                          <button
                            onClick={() => {
                              handleUpdateDayData(selectedDate, { hasFlow: false });
                              setSelectedDate(null);
                            }}
                            className="w-full flex items-center p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all text-gray-700 group shadow-sm"
                          >
                            <div className="bg-gray-100 p-2 rounded-lg group-hover:scale-110 transition-transform mr-3 text-gray-500">
                              <X size={16} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm">Fin de menstruación</p>
                              <p className="text-[10px] text-gray-500">Marcar que el sangrado ya terminó</p>
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleUpdateDayData(selectedDate, { hasFlow: true });
                              setSelectedDate(null);
                            }}
                            className="w-full flex items-center p-3 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-all text-pink-700 group shadow-sm"
                          >
                            <div className="bg-pink-100 p-2 rounded-lg group-hover:scale-110 transition-transform mr-3">
                              <Droplet size={16} className="fill-pink-500 opacity-70" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm">Registrar sangrado extra</p>
                              <p className="text-[10px] text-pink-500">Tu regla se extendió o adelantó</p>
                            </div>
                          </button>
                        )}

                        <button
                          onClick={() => setMenuView('form')}
                          className="w-full flex items-center p-3 rounded-xl bg-white border border-gray-200 hover:bg-obsidian-50 hover:border-obsidian-200 transition-all text-gray-800 group shadow-sm"
                        >
                          <div className="bg-obsidian-100 text-obsidian-600 p-2 rounded-lg group-hover:scale-110 transition-transform mr-3">
                            <PenTool size={16} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm">Diario Físico y Emocional</p>
                            <p className="text-[10px] text-gray-500">Registrar ánimo, molestias y notas</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VISTA 2: Formulario de Notas Completo */}
                  {menuView === 'form' && (
                    <div className="animate-slide-left">
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setMenuView('menu')} className="text-gray-400 hover:text-obsidian-600 transition-colors bg-white p-1.5 rounded-md shadow-sm border border-gray-200">
                            <ChevronLeft size={16} />
                          </button>
                          <div className="flex items-center gap-2 ml-1">
                            <FileText size={16} className="text-amber-500" />
                            <span className="text-sm font-bold text-gray-800 capitalize">
                              {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 bg-white rounded-md shadow-sm border border-gray-100">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6 mb-5">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Estado de Ánimo</p>
                          <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                            {['🧘‍♀️', '✨', '🌪️', '🥀', '🔥'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleUpdateDayData(selectedDate, { mood: notes[selectedDate.toDateString()]?.mood === emoji ? undefined : emoji })}
                                className={`text-xl p-2 rounded-lg transition-all ${notes[selectedDate.toDateString()]?.mood === emoji ? 'bg-obsidian-100 scale-125' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nivel de Molestia/Dolor</p>
                          <div className="flex gap-2">
                            {[0, 1, 2, 3].map(level => (
                              <button
                                key={level}
                                onClick={() => handleUpdateDayData(selectedDate, { pain: level })}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border shadow-sm ${notes[selectedDate.toDateString()]?.pain === level
                                  ? 'bg-pink-600 border-pink-700 text-white'
                                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                  }`}
                              >
                                {level === 0 ? 'NADA' : level === 1 ? 'LEVE' : level === 2 ? 'MEDIO' : 'FUERTE'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <textarea
                        value={notes[selectedDate.toDateString()]?.text || ''}
                        onChange={(e) => handleUpdateDayData(selectedDate, { text: e.target.value })}
                        placeholder="Notas sobre el mensaje del cuerpo, la Sombra o tus prácticas de hoy..."
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-obsidian-200 outline-none resize-none min-h-[120px] shadow-sm"
                      />

                      <div className="flex justify-between items-center mt-4">
                        <p className="text-[10px] text-gray-400 font-medium italic">Se guarda automáticamente.</p>
                        <button
                          onClick={() => setSelectedDate(null)}
                          className="text-xs bg-obsidian-800 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-black active:scale-95 transition-all"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-3 mt-6 pt-4 border-t border-gray-100 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#be185d]" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Menstruación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Folicular (Creatividad)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Ovulación (Plenitud)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Lútea (Intuición)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Día con Nota</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// DASHBOARD PRINCIPAL
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { setUser } = useApp();
  const [dailyQuestion, setDailyQuestion] = useState<MiracleQuestion | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MIRACLE_QUESTIONS.length);
    setDailyQuestion(MIRACLE_QUESTIONS[randomIndex]);
  }, []);

  const handleSetToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdatePeriodStart = (newDate: Date) => {
    if (window.confirm(`¿Estás segura de registrar el ${newDate.toLocaleDateString()} como el inicio de tu ciclo menstrual?`)) {
      const offset = newDate.getTimezoneOffset();
      const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
      const formattedDateLocal = localDate.toISOString().split('T')[0];
      setUser({ ...user, lastPeriodDate: formattedDateLocal });
    }
  };

  const handleSubmitMiracle = async () => {
    if (!answer.trim() || !dailyQuestion) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await getMiracleFeedback(dailyQuestion.question, answer);
      setFeedback(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastPeriod = new Date(user.lastPeriodDate);
  const birthDate = new Date(user.birthDate);

  const diffTime = Math.abs(currentDate.getTime() - lastPeriod.getTime());
  const cycleDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const cycleProgress = Math.min((cycleDay / user.cycleLength) * 100, 100);

  const currentAge = (currentDate.getFullYear() - birthDate.getFullYear());
  const yearsRemaining = Math.max(0, 51 - currentAge);
  const cyclesRemaining = Math.floor(yearsRemaining * 13.3);

  const moonData = getMoonPhaseData(currentDate);

  const dateString = currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = currentDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Bienvenida, {user.name}</h2>
          <p className="text-gray-600 font-sans">Hoy es un buen día para conectar con tu centro.</p>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-right mb-2">
            <p className="text-sm font-bold text-obsidian-800 capitalize">{dateString}</p>
            <div className="flex items-center justify-end text-xs text-gray-500 space-x-1">
              <MapPin size={12} />
              <span>{timeString} (Local)</span>
            </div>
          </div>
          <button
            onClick={handleSetToday}
            className="flex items-center space-x-2 bg-white border border-obsidian-200 text-obsidian-700 px-4 py-2 rounded-lg text-sm hover:bg-obsidian-50 transition-colors shadow-sm"
          >
            <RotateCw size={14} />
            <span>Hoy</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Columna Izquierda */}
        <div className="md:col-span-2 flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden flex flex-col h-full group hover-lift transition-obsidian">
            <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
              <Droplet size={120} className="text-obsidian-500" />
            </div>

            <div className="flex items-center space-x-2 text-obsidian-600 mb-6">
              <Droplet size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">Ciclo Menstrual y Bio-Ritmo</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-serif font-bold text-obsidian-900">{cycleDay}</span>
                <span className="text-gray-500 font-medium">/ {user.cycleLength} días</span>
              </div>

              <div className="w-full bg-gray-100 h-3 rounded-full mt-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-obsidian-300 to-obsidian-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${cycleProgress}%` }}
                ></div>
              </div>

              <button
                onClick={() => handleUpdatePeriodStart(new Date())}
                className="mt-5 w-full flex items-center justify-center space-x-2 bg-pink-50 hover:bg-pink-100 text-pink-700 py-3 rounded-xl transition-all border border-pink-100 font-bold active:scale-95"
              >
                <Droplet size={16} />
                <span>Registrar inicio del periodo hoy</span>
              </button>

              {(() => {
                let phaseKey: keyof typeof PHASE_DETAILS = 'menstrual';
                if (cycleDay >= 7 && cycleDay < 14) phaseKey = 'follicular';
                else if (cycleDay >= 14 && cycleDay < 21) phaseKey = 'ovulatory';
                else if (cycleDay >= 21) phaseKey = 'luteal';

                const phase = PHASE_DETAILS[phaseKey];

                return (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-obsidian-800 font-bold flex items-center gap-2 text-lg">
                        <Sparkles size={16} className="text-obsidian-400" />
                        {phase.title}: {phase.archetype}
                      </p>
                      <p className="text-sm text-gray-600 italic mt-1 leading-relaxed">"{phase.summary}"</p>
                    </div>

                    <button
                      onClick={() => setShowPhaseDetails(!showPhaseDetails)}
                      className="flex items-center space-x-1 text-xs font-bold text-obsidian-600 hover:text-obsidian-800 transition-colors uppercase tracking-widest p-1 -ml-1"
                    >
                      <span>{showPhaseDetails ? 'Ver menos' : 'Leer recomendaciones'}</span>
                      {showPhaseDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showPhaseDetails && (
                      <div className="animate-slide-down bg-obsidian-50/50 p-4 rounded-xl border border-obsidian-100 mt-2 space-y-4 shadow-inner">
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-obsidian-500 uppercase tracking-widest flex items-center gap-1">
                            <Info size={12} /> Escucha profunda
                          </h5>
                          <p className="text-sm text-gray-700 leading-relaxed font-sans">{phase.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <h6 className="text-[10px] font-bold text-obsidian-600 uppercase tracking-tighter flex items-center gap-1 mb-1">
                              <Activity size={12} /> Ejercicio
                            </h6>
                            <p className="text-xs text-gray-600 leading-tight">{phase.recommendations.exercise}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <h6 className="text-[10px] font-bold text-obsidian-600 uppercase tracking-tighter flex items-center gap-1 mb-1">
                              <Zap size={12} /> Energía
                            </h6>
                            <p className="text-xs text-gray-600 leading-tight">{phase.recommendations.energy}</p>
                          </div>
                        </div>

                        <div className="bg-obsidian-900 text-white p-4 rounded-lg mt-2 shadow-md">
                          <h6 className="text-[10px] font-bold text-obsidian-300 uppercase tracking-tighter flex items-center gap-1 mb-1">
                            <MoonIcon size={12} /> Práctica Sugerida
                          </h6>
                          <p className="text-xs font-medium italic">{phase.recommendations.practice}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <CycleCalendar lastPeriod={lastPeriod} cycleLength={user.cycleLength} onUpdatePeriod={handleUpdatePeriodStart} />

          </div>
        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-6 h-full">

          <div className="bg-dark-obsidian text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group hover-lift transition-obsidian flex flex-col">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block mb-1">Fase Lunar</span>
                <h3 className="text-2xl font-serif font-bold">{moonData.name}</h3>
              </div>
              <div className="-mt-2 -mr-2">
                <MoonPhaseVisual phaseIndex={moonData.phaseIndex} />
              </div>
            </div>

            <div className="relative z-10 mt-4">
              <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-200 mb-3 border border-white/20">
                Luna {moonData.moonNumberOfYear} de {moonData.year}
              </div>
              <p className="text-slate-300 text-sm">{moonData.desc}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden group hover-lift transition-obsidian flex-1 flex flex-col justify-center">
            <div className="absolute right-[-10px] bottom-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Hourglass size={100} className="text-amber-500" />
            </div>
            <div className="flex items-center space-x-2 text-amber-600 mb-4 relative z-10">
              <Calendar size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">Reserva Creativa</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-serif font-bold text-obsidian-900">{cyclesRemaining}</span>
                <span className="text-gray-500 font-medium">ciclos lunares</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                Lunas fértiles restantes antes de la plenitud de la menopausia (Sabia).
              </p>
            </div>
          </div>

        </div>
      </div>

      {dailyQuestion && (
        <div className="bg-gradient-to-r from-obsidian-50 to-white border border-obsidian-200 p-6 md:p-8 rounded-2xl relative shadow-sm mt-8">
          <div className="absolute top-0 left-0 bg-obsidian-200 text-obsidian-800 text-xs font-bold px-3 py-1 rounded-br-lg uppercase tracking-wide flex items-center gap-2">
            <Wand2 size={12} /> Pregunta
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-white p-3 rounded-full shadow-sm text-obsidian-500 shrink-0 border border-obsidian-100">
                <Sparkles size={24} />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-xl font-serif text-obsidian-900 italic mb-1 leading-relaxed">"{dailyQuestion.question}"</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">Tema: {dailyQuestion.theme}</p>

                {!feedback ? (
                  <div className="bg-white p-4 rounded-xl border border-obsidian-100 shadow-sm w-full transition-all focus-within:ring-2 focus-within:ring-obsidian-200">
                    <textarea
                      className="w-full min-h-[80px] bg-white text-gray-900 placeholder-gray-400 outline-none resize-none p-2 rounded-lg text-sm"
                      placeholder="Visualiza tu respuesta aquí. ¿Cómo se ve, se siente o se escucha ese milagro?"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSubmitMiracle}
                        disabled={isSubmitting || !answer.trim()}
                        className="flex items-center gap-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={16} className="animate-spin" /> Conectando...</>
                        ) : (
                          <><Send size={16} /> Materializar Intención</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-obsidian-200 shadow-xl animate-fade-in w-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-obsidian-100/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-obsidian-100 rounded-lg text-obsidian-600 border border-obsidian-200">
                            <Sparkles size={18} />
                          </div>
                          <h4 className="font-serif font-bold text-xl text-obsidian-900">Tu Plan Alquímico</h4>
                        </div>
                        <button
                          onClick={() => { setFeedback(null); setAnswer(''); }}
                          className="text-xs font-bold text-obsidian-400 hover:text-obsidian-600 uppercase tracking-widest transition-colors bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200"
                        >
                          Nueva Pregunta
                        </button>
                      </div>
                      <div className="max-w-none text-gray-800 prose prose-sm prose-p:leading-relaxed">
                        <MarkdownRenderer content={feedback} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;