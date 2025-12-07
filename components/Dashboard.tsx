
import React, { useState, useEffect } from 'react';
import { UserProfile, MiracleQuestion } from '../types';
import { MIRACLE_QUESTIONS } from '../constants';
import { getMiracleFeedback } from '../services/geminiService';
import { Sparkles, Droplet, Calendar, Hourglass, RotateCw, MapPin, Send, Loader2, Wand2 } from 'lucide-react';

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
  
  switch(phaseIndex) {
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

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [dailyQuestion, setDailyQuestion] = useState<MiracleQuestion | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Miracle Question State
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplet size={80} className="text-obsidian-500" />
          </div>
          <div className="flex items-center space-x-2 text-obsidian-600 mb-4">
            <Droplet size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">Ciclo Menstrual</span>
          </div>
          <div className="relative z-10">
            <span className="text-4xl font-serif font-bold text-obsidian-900">{cycleDay}</span>
            <span className="text-gray-500 ml-2">/ {user.cycleLength} días</span>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-obsidian-300 to-obsidian-600 h-full rounded-full" 
                    style={{ width: `${cycleProgress}%` }}
                ></div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
                {cycleDay < 7 ? 'Fase Menstrual: Descanso' : 
                 cycleDay < 14 ? 'Fase Folicular: Creatividad' : 
                 cycleDay < 21 ? 'Fase Ovulatoria: Plenitud' : 'Fase Lútea: Intuición'}
            </p>
          </div>
        </div>

        {/* Moon Card (Updated Visuals) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
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
            <p className="text-slate-300 text-sm">{moonData.desc}</p>
          </div>
        </div>

        {/* Egg Countdown Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100 relative overflow-hidden group hover:shadow-md transition-all">
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
                            <div className="bg-white p-6 rounded-xl border-l-4 border-obsidian-400 shadow-md animate-fade-in w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-serif font-bold text-lg text-obsidian-900">Tu Plan Alquímico</h4>
                                    <button 
                                        onClick={() => { setFeedback(null); setAnswer(''); }}
                                        className="text-xs text-gray-400 hover:text-obsidian-500"
                                    >
                                        Nueva Pregunta
                                    </button>
                                </div>
                                {/* Added explicit text color to ensure visibility against white background */}
                                <div className="prose prose-sm prose-p:text-gray-900 prose-headings:text-obsidian-900 prose-headings:font-serif max-w-none text-gray-900">
                                    <div className="whitespace-pre-wrap">{feedback}</div>
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
