
import React, { useState, useEffect } from 'react';
import { UserProfile, MiracleQuestion } from '../types';
import { MIRACLE_QUESTIONS, PHASE_DETAILS } from '../constants';
import { getMiracleFeedback } from '../services/geminiService';
import { Sparkles, Droplet, Calendar, Hourglass, RotateCw, MapPin, Send, Loader2, Wand2, Info, ChevronDown, ChevronUp, Zap, Activity, Moon as MoonIcon, FileText, X, Mail } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface DashboardProps {
  user: UserProfile;
}

// Extracted MoonSVG to avoid re-creation and fix type inference issues
const MoonSVG = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-lg">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <radialGradient id="craterGradient">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </radialGradient>
    </defs>
    {children}
  </svg>
);

// Helper component to draw the moon phase
const MoonPhaseVisual: React.FC<{ phaseIndex: number }> = ({ phaseIndex }) => {
  // Phase Index: 0=New, 1=Waxing Crescent, 2=First Quarter, 3=Waxing Gibbous, 4=Full, 5=Waning Gibbous, 6=Last Quarter, 7=Waning Crescent

  // Colors: Dark part #334155 (Slate 700), Light part #f8fafc (Slate 50) with glow
  switch (phaseIndex) {
    case 0: // New Moon
      return <MoonSVG><circle cx="50" cy="50" r="48" fill="#334155" stroke="#475569" strokeWidth="1" /></MoonSVG>;
    case 1: // Waxing Crescent
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 1 50 98 A30 48 0 0 0 50 2" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 2: // First Quarter
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 1 50 98 Z" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 3: // Waxing Gibbous
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <path d="M50 2 A30 48 0 0 1 50 98 A48 48 0 0 1 50 2" fill="#334155" />
        </MoonSVG>
      );
    case 4: // Full Moon
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <circle cx="50" cy="50" r="48" fill="url(#craterGradient)" opacity="0.2" />
        </MoonSVG>
      );
    case 5: // Waning Gibbous
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <path d="M50 2 A30 48 0 0 0 50 98 A48 48 0 0 0 50 2" fill="#334155" />
        </MoonSVG>
      );
    case 6: // Last Quarter
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 0 50 98 Z" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 7: // Waning Crescent
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 0 50 98 A30 48 0 0 1 50 2" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    default:
      return <MoonSVG><circle cx="50" cy="50" r="48" fill="#f8fafc" /></MoonSVG>;
  }
};

const getMoonPhaseData = (date: Date) => {
  const synodic = 29.53058867;
  // Known New Moon: Jan 21, 2023 at 20:53 UTC
  const knownNewMoon = new Date('2023-01-21T20:53:00Z');
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = date.getTime() - knownNewMoon.getTime();
  const diffDays = diffTime / msPerDay;
  const phaseCycle = diffDays % synodic;

  // Phase Index (0-7)
  // New: 0-1.8, WaxCresc: 1.8-5.5, FirstQ: 5.5-9.2, WaxGibb: 9.2-12.9, Full: 12.9-16.6, WanGibb: 16.6-20.3, LastQ: 20.3-24, WanCresc: 24-27.7, New: 27.7-29.5
  // Simplifying for 8 distinct segments of approx 3.7 days
  const phaseIndex = Math.floor(((phaseCycle / synodic) * 8)) % 8;

  // Calculate Moon Number of the Year
  const currentYear = date.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  // Calculate how many synodic cycles have passed since the start of the year
  // We align with the first new moon of the year approx.
  // Actually, simplest is calculating total moons since known reference, then subtracting moons at start of year.
  const moonsSinceReference = Math.floor(diffDays / synodic);
  const daysToStartOfYear = (startOfYear.getTime() - knownNewMoon.getTime()) / msPerDay;
  const moonsAtStartOfYear = Math.floor(daysToStartOfYear / synodic);
  const moonNumberOfYear = (moonsSinceReference - moonsAtStartOfYear) + 1;

  let name = '';
  let desc = '';

  switch (phaseIndex) {
    case 0: name = 'Luna Nueva'; desc = 'Siembra intenciones'; break;
    case 1: name = 'Luna Creciente'; desc = 'Visualiza y proyecta'; break;
    case 2: name = 'Cuarto Creciente'; desc = 'Acción y crecimiento'; break;
    case 3: name = 'Gibosa Creciente'; desc = 'Perfecciona tu obra'; break;
    case 4: name = 'Luna Llena'; desc = 'Plenitud y manifestación'; break;
    case 5: name = 'Gibosa Menguante'; desc = 'Agradece y comparte'; break;
    case 6: name = 'Cuarto Menguante'; desc = 'Suelta lo que pesa'; break;
    case 7: name = 'Luna Menguante'; desc = 'Descanso y limpieza'; break;
    default: name = 'Luna Nueva'; desc = 'Inicio';
  }

  return { name, desc, phaseIndex, moonNumberOfYear, year: currentYear };
};

// PREDICTIVE CYCLE CALENDAR COMPONENT
const CycleCalendar: React.FC<{ lastPeriod: Date, cycleLength: number }> = ({ lastPeriod, cycleLength }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<Record<string, { text: string, mood?: string, pain?: number }>>(() => {
    const saved = localStorage.getItem('obsidiana_calendar_notes');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    // Migration check: if string, convert to object
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

  const handleUpdateDayData = (date: Date, updates: Partial<{ text: string, mood: string, pain: number }>) => {
    const dateKey = date.toDateString();
    const current = notes[dateKey] || { text: '' };
    const newData = { ...current, ...updates };

    // Remove if empty
    if (!newData.text.trim() && !newData.mood && newData.pain === undefined) {
      const newNotes = { ...notes };
      delete newNotes[dateKey];
      setNotes(newNotes);
    } else {
      setNotes({ ...notes, [dateKey]: newData });
    }
  };

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay(); // 0 is Sunday

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
  }

  const getDayStatus = (date: Date) => {
    if (!date) return null;
    const diffDays = Math.floor((date.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;

    if (cycleDay <= 6) return 'menstrual';
    if (cycleDay >= 7 && cycleDay <= 13) return 'follicular';
    if (cycleDay >= 14 && cycleDay <= 20) return 'ovulatory';
    return 'luteal';
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className={`mt-4 transition-all duration-500 ${isExpanded ? 'bg-white/5 rounded-2xl p-4' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Calendario Predictivo</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md transition-colors"
        >
          {isExpanded ? 'CERRAR' : 'AMPLIAR'}
        </button>
      </div>

      {isExpanded && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 hover:bg-white/10 rounded">
              <ChevronUp className="-rotate-90" size={16} />
            </button>
            <span className="text-sm font-bold font-serif">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 hover:bg-white/10 rounded">
              <ChevronUp className="rotate-90" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
              <div key={d} className="text-[8px] font-bold text-slate-500">{d}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const status = getDayStatus(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const dateKey = date.toDateString();
              const hasNote = !!notes[dateKey];
              const isSelected = selectedDate?.toDateString() === dateKey;

              let bgColor = 'transparent';
              if (status === 'menstrual') bgColor = '#be185d';
              if (status === 'follicular') bgColor = '#10b981';
              if (status === 'ovulatory') bgColor = '#0ea5e9';
              if (status === 'luteal') bgColor = '#8b5cf6';

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`relative h-10 flex flex-col items-center justify-center text-[10px] rounded-lg transition-all hover:bg-white/10 ${isToday ? 'ring-2 ring-white ring-inset' : ''} ${isSelected ? 'bg-white/20' : ''}`}
                  style={{ backgroundColor: bgColor !== 'transparent' ? `${bgColor}33` : 'transparent' }}
                >
                  <span className={`${status === 'menstrual' ? 'text-pink-400 font-bold' : 'text-slate-200'} ${isSelected ? 'text-white scale-110' : ''}`}>{date.getDate()}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {status === 'menstrual' && <div className="w-1 h-1 bg-pink-500 rounded-full" />}
                    {hasNote && <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notes Interface */}
          {selectedDate && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/10 animate-slide-down">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Registro: {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Mood Selection */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estado de Ánimo</p>
                <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                  {['🧘‍♀️', '✨', '🌪️', '🥀', '🔥'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleUpdateDayData(selectedDate, { mood: notes[selectedDate.toDateString()]?.mood === emoji ? undefined : emoji })}
                      className={`text-lg p-1 rounded-md transition-all ${notes[selectedDate.toDateString()]?.mood === emoji ? 'bg-white/20 scale-125' : 'opacity-50 hover:opacity-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level */}
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nivel de Molestia/Dolor</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => handleUpdateDayData(selectedDate, { pain: level })}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border ${notes[selectedDate.toDateString()]?.pain === level
                        ? 'bg-pink-600 border-pink-400 text-white'
                        : 'bg-black/20 border-white/5 text-slate-400 opacity-60'
                        }`}
                    >
                      {level === 0 ? 'NADA' : level === 1 ? 'LEVE' : level === 2 ? 'MEDIO' : 'FUERTE'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={notes[selectedDate.toDateString()]?.text || ''}
                onChange={(e) => handleUpdateDayData(selectedDate, { text: e.target.value })}
                placeholder="Notas sobre el mensaje del cuerpo..."
                className="w-full bg-black/20 border-none rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-amber-400/50 outline-none resize-none min-h-[60px]"
              />
              <p className="text-[8px] text-slate-500 mt-2 italic">Tus registros se guardan en este dispositivo.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#be185d]" />
              <span className="text-[9px] text-slate-400">Menstruación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-[9px] text-slate-400">Follicular (Creatividad)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
              <span className="text-[9px] text-slate-400">Ovulación (Plenitud)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span className="text-[9px] text-slate-400">Lútea (Intuición)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[9px] text-slate-400">Día con Nota</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [dailyQuestion, setDailyQuestion] = useState<MiracleQuestion | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Miracle Question State
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

  // Biological Calculations
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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Cycle Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden group hover-lift transition-obsidian flex flex-col h-full">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Droplet size={80} className="text-obsidian-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-obsidian-600">
              <Droplet size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">Ciclo Menstrual</span>
            </div>
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-serif font-bold text-obsidian-900">{cycleDay}</span>
              <span className="text-gray-500 font-medium">/ {user.cycleLength} días</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-6 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-obsidian-300 to-obsidian-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${cycleProgress}%` }}
              ></div>
            </div>

            {/* Phase Logic */}
            {(() => {
              let phaseKey: keyof typeof PHASE_DETAILS = 'menstrual';
              if (cycleDay >= 7 && cycleDay < 14) phaseKey = 'follicular';
              else if (cycleDay >= 14 && cycleDay < 21) phaseKey = 'ovulatory';
              else if (cycleDay >= 21) phaseKey = 'luteal';

              const phase = PHASE_DETAILS[phaseKey];

              return (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-obsidian-800 font-bold flex items-center gap-2">
                      <Sparkles size={14} className="text-obsidian-400" />
                      {phase.title}: {phase.archetype}
                    </p>
                    <p className="text-sm text-gray-600 italic mt-1 leading-snug">"{phase.summary}"</p>
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
                        <h5 className="text-[10px] font-bold text-obsidian-400 uppercase tracking-widest flex items-center gap-1">
                          <Info size={10} /> Escucha profunda
                        </h5>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">{phase.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <h6 className="text-[10px] font-bold text-obsidian-600 uppercase tracking-tighter flex items-center gap-1">
                            <Activity size={10} /> Ejercicio
                          </h6>
                          <p className="text-[10px] text-slate-600 leading-tight">{phase.recommendations.exercise}</p>
                        </div>
                        <div className="space-y-1">
                          <h6 className="text-[10px] font-bold text-obsidian-600 uppercase tracking-tighter flex items-center gap-1">
                            <Zap size={10} /> Energía
                          </h6>
                          <p className="text-[10px] text-slate-600 leading-tight">{phase.recommendations.energy}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-obsidian-100/50">
                        <h6 className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter flex items-center gap-1">
                          <MoonIcon size={10} /> Práctica Sugerida
                        </h6>
                        <p className="text-[10px] text-slate-700 font-medium italic mt-0.5">{phase.recommendations.practice}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Moon & Calendar Card */}
        <div className="bg-dark-obsidian text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group hover-lift transition-obsidian flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block mb-1">Fase Lunar</span>
              <h3 className="text-2xl font-serif font-bold">{moonData.name}</h3>
            </div>
            {/* Dynamic Moon Visual */}
            <div className="-mt-2 -mr-2">
              <MoonPhaseVisual phaseIndex={moonData.phaseIndex} />
            </div>
          </div>

          <div className="relative z-10 mt-2">
            <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-200 mb-3 border border-white/20">
              Luna {moonData.moonNumberOfYear} de {moonData.year}
            </div>
            <p className="text-slate-300 text-sm mb-6">{moonData.desc}</p>

            {/* Menstrual Calendar Integration */}
            <CycleCalendar lastPeriod={lastPeriod} cycleLength={user.cycleLength} />
          </div>
        </div>

        {/* Egg Countdown Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden group hover-lift transition-obsidian">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Hourglass size={80} className="text-amber-500" />
          </div>
          <div className="flex items-center space-x-2 text-amber-600 mb-4">
            <Calendar size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">Reserva Creativa</span>
          </div>
          <div className="relative z-10">
            <span className="text-4xl font-serif font-bold text-obsidian-900">{cyclesRemaining}</span>
            <span className="text-gray-500 ml-2">ciclos lunares</span>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Lunas fértiles restantes antes de la plenitud de la menopausia (Sabia).
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Miracle Question Section */}
      {dailyQuestion && (
        <div className="bg-gradient-to-r from-obsidian-50 to-white border border-obsidian-200 p-6 md:p-8 rounded-2xl relative shadow-sm">
          <div className="absolute top-0 left-0 bg-obsidian-200 text-obsidian-800 text-xs font-bold px-3 py-1 rounded-br-lg uppercase tracking-wide flex items-center gap-2">
            <Wand2 size={12} /> Pregunta
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-white p-3 rounded-full shadow-sm text-obsidian-500 shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-xl font-serif text-obsidian-900 italic mb-1">"{dailyQuestion.question}"</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">Tema: {dailyQuestion.theme}</p>

                {!feedback ? (
                  <div className="bg-white p-4 rounded-xl border border-obsidian-100 shadow-sm w-full">
                    <textarea
                      className="w-full min-h-[80px] bg-white text-gray-900 placeholder-gray-400 outline-none resize-none p-2 rounded-lg"
                      placeholder="Visualiza tu respuesta aquí. ¿Cómo se ve, se siente o se escucha ese milagro?"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSubmitMiracle}
                        disabled={isSubmitting || !answer.trim()}
                        className="flex items-center gap-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
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
                  <div className="glass p-6 md:p-8 rounded-2xl border border-obsidian-200 shadow-xl animate-fade-in w-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-obsidian-100/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-obsidian-100 rounded-lg text-obsidian-600">
                            <Sparkles size={18} />
                          </div>
                          <h4 className="font-serif font-bold text-xl text-obsidian-900">Tu Plan Alquímico</h4>
                        </div>
                        <button
                          onClick={() => { setFeedback(null); setAnswer(''); }}
                          className="text-xs font-bold text-obsidian-400 hover:text-obsidian-600 uppercase tracking-widest transition-colors"
                        >
                          Nueva Pregunta
                        </button>
                      </div>
                      <div className="max-w-none text-black">
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
    </div >
  );
};

export default Dashboard;
