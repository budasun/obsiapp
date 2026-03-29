import React from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-amber-500/95 backdrop-blur-sm text-white px-5 py-2.5 rounded-full flex items-center justify-center gap-2 z-[100] shadow-xl animate-slide-up text-xs font-bold whitespace-nowrap">
      <WifiOff size={16} />
      <span>Modo sin conexión</span>
    </div>
  );
};

export default OfflineBanner;
