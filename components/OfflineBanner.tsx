import React from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-50 shadow-md animate-slide-down">
      <WifiOff size={16} />
      <span className="text-sm font-medium">Sin conexión a internet. Algunos datos podrían no estar actualizados.</span>
    </div>
  );
};

export default OfflineBanner;
