import React, { useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../src/hooks/usePWAInstall';

/**
 * Banner flotante de instalación PWA.
 * Solo se renderiza si:
 *  - El navegador disparó `beforeinstallprompt` (la app es instalable)
 *  - La app NO está ya instalada en modo standalone
 *  - La usuaria no lo ha descartado en esta sesión
 */
const InstallBanner: React.FC = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // No mostrar si no es instalable o la usuaria lo cerró
  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const accepted = await installApp();
      if (!accepted) {
        // La usuaria rechazó — ocultar el banner igualmente
        setDismissed(true);
      }
      // Si aceptó, isInstallable se volverá false automáticamente
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] animate-slide-up">
      <div className="bg-white/95 backdrop-blur-xl border border-obsidian-200 rounded-2xl shadow-2xl p-4 relative overflow-hidden">
        {/* Decorative gradient bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E4007C] via-obsidian-400 to-amber-400" />

        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-obsidian-50 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#E4007C] to-obsidian-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={22} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-obsidian-900 text-sm leading-tight">
              Instala Obsidiana
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Accede más rápido y úsala sin conexión directamente desde tu pantalla de inicio.
            </p>
          </div>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#E4007C] to-obsidian-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          <Download size={16} className={isInstalling ? 'animate-bounce' : ''} />
          <span>{isInstalling ? 'Instalando…' : 'Instalar ObsiApp'}</span>
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
