import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detectar Safari
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    // Detectar modo standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Validar si fue cerrado previamente
    const isDismissed = localStorage.getItem('obsiapp_ios_prompt_dismissed') === 'true';

    if (isIOS && isSafari && !isStandalone && !isDismissed) {
      // Mostrar el globo después de unos segundos
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('obsiapp_ios_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] animate-slide-up">
      <div className="bg-white/95 backdrop-blur-md border border-obsidian-100 p-5 rounded-3xl shadow-2xl relative shadow-obsidian-200/50">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
        
        <h3 className="font-serif font-bold text-lg text-obsidian-900 mb-2 pr-6">Instala ObsiApp</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          Instala esta aplicación en tu dispositivo para una experiencia nativa y acceso offline:
        </p>
        
        <div className="space-y-3 text-sm font-medium text-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
              <Share size={20} />
            </div>
            <span>1. Toca en el botón <b>Compartir</b> en la barra inferior.</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-obsidian-50 text-obsidian-600 rounded-xl">
              <PlusSquare size={20} />
            </div>
            <span>2. Selecciona <b>"Agregar a Inicio"</b>.</span>
          </div>
        </div>
        
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white/95 border-r-[12px] border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallPrompt;
