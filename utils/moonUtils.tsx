import React from 'react';

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

export const MoonPhaseVisual: React.FC<{ phaseIndex: number }> = ({ phaseIndex }) => {
  switch (phaseIndex) {
    case 0:
      return <MoonSVG><circle cx="50" cy="50" r="48" fill="#334155" stroke="#475569" strokeWidth="1" /></MoonSVG>;
    case 1:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 1 50 98 A30 48 0 0 0 50 2" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 2:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 1 50 98 Z" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 3:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <path d="M50 2 A30 48 0 0 1 50 98 A48 48 0 0 1 50 2" fill="#334155" />
        </MoonSVG>
      );
    case 4:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <circle cx="50" cy="50" r="48" fill="url(#craterGradient)" opacity="0.2" />
        </MoonSVG>
      );
    case 5:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#f8fafc" filter="url(#glow)" />
          <path d="M50 2 A30 48 0 0 0 50 98 A48 48 0 0 0 50 2" fill="#334155" />
        </MoonSVG>
      );
    case 6:
      return (
        <MoonSVG>
          <circle cx="50" cy="50" r="48" fill="#334155" />
          <path d="M50 2 A48 48 0 0 0 50 98 Z" fill="#f8fafc" filter="url(#glow)" />
        </MoonSVG>
      );
    case 7:
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

export const getMoonPhaseData = (date: Date) => {
  const synodic = 29.53058867;
  const knownNewMoon = new Date('2023-01-21T20:53:00Z');
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = date.getTime() - knownNewMoon.getTime();
  const diffDays = diffTime / msPerDay;
  const phaseCycle = diffDays % synodic;

  const phaseIndex = Math.floor(((phaseCycle / synodic) * 8)) % 8;

  const currentYear = date.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
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
