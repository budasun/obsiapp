
import React, { useState } from 'react';
import { AppView, UserProfile } from '../types';
import {
  Moon,
  BookHeart,
  MessageCircleHeart,
  Users,
  BookOpen,
  LogOut,
  Egg,
  Calendar,
  User,
  Menu,
  X,
  Mail,
  Library,
  ScrollText,
  Crown,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);
  const { isOnline, firebaseUser } = useApp();

  const PRO_VIEWS = [AppView.DREAMS, AppView.BITACORAS, AppView.CHATBOT, AppView.COMMUNITY];

  const handleStartTrial = async () => {
    if (!user) return;
    
    const now = Date.now();
    
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          trialStartTime: now
        });
      } catch (error) {
        console.error('Error guardando trial en Firebase:', error);
      }
    }

    user.trialStartTime = now;
    
    setShowTrialPopup(false);
    if (pendingView) {
      onChangeView(pendingView);
      setPendingView(null);
    }
  };

  const handleProViewClick = (view: AppView) => {
    if (!user?.isPremium) {
      const trialTime = user?.trialStartTime;
      if (!trialTime) {
        setPendingView(view);
        setShowTrialPopup(true);
      } else {
        const elapsedMins = (Date.now() - trialTime) / (1000 * 60);
        if (elapsedMins >= 28) {
          setPendingView(view);
          setShowTrialPopup(true);
        } else {
          onChangeView(view);
        }
      }
    } else {
      onChangeView(view);
    }
    setIsMobileMenuOpen(false);
  };

  if (!user && currentView === AppView.LOGIN) {
    return <>{children}</>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => {
    const isProView = PRO_VIEWS.includes(view);
    const handleClick = () => {
      if (isProView && !user?.isPremium) {
        const trialTime = user?.trialStartTime;
        if (!trialTime) {
          setPendingView(view);
          setShowTrialPopup(true);
        } else {
          const elapsedMins = (Date.now() - trialTime) / (1000 * 60);
          if (elapsedMins >= 28) {
            setPendingView(view);
            setShowTrialPopup(true);
          } else {
            onChangeView(view);
          }
        }
      } else {
        onChangeView(view);
      }
      setIsMobileMenuOpen(false);
    };

    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === view
          ? 'bg-obsidian-200 text-obsidian-900 shadow-sm'
          : 'text-gray-600 hover:bg-obsidian-50 hover:text-obsidian-700'
          }`}
      >
        <Icon size={20} />
        <span className="font-sans font-medium">{label}</span>
        {isProView && <Crown size={14} className="ml-auto text-amber-400" />}
      </button>
    );
  };

  const Navigation = () => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      <div className="pb-4 mb-4 border-b border-obsidian-100">
        <button
          onClick={() => {
            onChangeView(AppView.PRO_UPGRADE);
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            currentView === AppView.PRO_UPGRADE
              ? 'bg-gradient-to-r from-amber-400 to-[#D4AF37] text-obsidian-900 shadow-md'
              : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
          }`}
        >
          <Crown size={20} className={currentView === AppView.PRO_UPGRADE ? 'text-obsidian-900' : 'text-amber-500'} />
          <span className="font-sans font-bold">Subir a PRO</span>
        </button>
      </div>
      
      <NavItem view={AppView.DASHBOARD} icon={Moon} label="Mi Ciclo Lunar" />
      <NavItem view={AppView.AGENDA} icon={Calendar} label="Mi Agenda" />
      <NavItem view={AppView.DREAMS} icon={BookHeart} label="Diario de Sueños" />
      <NavItem view={AppView.BITACORAS} icon={ScrollText} label="Bitácoras" />
      <NavItem view={AppView.CHATBOT} icon={MessageCircleHeart} label="Consejera Osiris" />
      <NavItem view={AppView.COMMUNITY} icon={Users} label="Comunidad" />
      <NavItem view={AppView.MESSAGES} icon={Mail} label="Mensajes" />
      <NavItem view={AppView.BOOK} icon={Library} label="La Biblioteca" />
      <NavItem view={AppView.GLOSSARY} icon={BookOpen} label="Glosario" />
    </nav>
  );

  return (
    <div className="flex h-screen bg-obsidian-gradient overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-obsidian-100 flex-shrink-0 hidden md:flex flex-col shadow-lg">
        <div className="p-6 border-b border-obsidian-50 flex items-center space-x-2">
          <div className="p-2 bg-obsidian-100 rounded-full">
            <Egg className="text-[#E4007C] fill-[#E4007C]" size={24} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-obsidian-900 tracking-tight">Obsidiana</h1>
        </div>

        <Navigation />

        <div className="p-4 border-t border-obsidian-50 bg-gray-50/50">
          <button
            onClick={() => onChangeView(AppView.PROFILE)}
            className={`w-full mb-3 flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${currentView === AppView.PROFILE ? 'bg-obsidian-100' : 'hover:bg-white border border-transparent hover:border-obsidian-100 shadow-sm'}`}
          >
            <div className="w-8 h-8 rounded-full bg-obsidian-200 flex items-center justify-center text-obsidian-700 font-bold text-xs">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-gray-700 truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-400">Ver Perfil</p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-50 md:hidden flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-obsidian-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Egg className="text-[#E4007C] fill-[#E4007C]" size={24} />
            <h1 className="font-serif text-xl font-bold text-obsidian-900 uppercase tracking-widest">Obsidiana</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-obsidian-50 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <Navigation />

        <div className="p-6 border-t border-obsidian-50 bg-gray-50/50">
          <button
            onClick={() => {
              onChangeView(AppView.PROFILE);
              setIsMobileMenuOpen(false);
            }}
            className="w-full mb-4 flex items-center space-x-3 p-3 rounded-xl bg-white shadow-sm border border-obsidian-100"
          >
            <div className="w-10 h-10 rounded-full bg-obsidian-200 flex items-center justify-center text-obsidian-800 font-bold">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="text-left overflow-hidden">
              <p className="font-bold text-gray-800 truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 font-medium">Gestionar cuenta</p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 text-red-500 font-sans font-bold hover:bg-red-50 rounded-xl transition-colors border border-red-100"
          >
            <LogOut size={18} />
            <span>Finalizar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-obsidian-100 p-4 flex justify-between items-center shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-obsidian-900 active:bg-obsidian-50 rounded-lg transition-colors">
          <Menu size={28} />
        </button>
        <div className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2">
          <Egg className="text-[#E4007C] fill-[#E4007C]" size={20} />
          <span className="font-serif text-lg font-bold text-obsidian-900">Obsidiana</span>
        </div>
        <button
          onClick={() => onChangeView(AppView.PROFILE)}
          className="w-10 h-10 rounded-full bg-obsidian-50 flex items-center justify-center text-obsidian-800 border border-obsidian-100 active:scale-95 transition-transform"
        >
          <User size={20} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative md:pt-0 pt-16">
        <div className="max-w-4xl mx-auto p-4 md:p-10 pb-20 md:pb-10">
          {children}
        </div>
      </main>

      {/* Trial Popup Modal */}
      {showTrialPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl transform scale-100 animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-amber-100 rounded-full">
                <Sparkles className="text-amber-500" size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-serif font-bold text-obsidian-900 text-center mb-4">
              El Despertar de la Semilla
            </h2>
            <p className="text-obsidian-600 text-center leading-relaxed mb-8">
              Te obsequiamos un ciclo lunar en miniatura: 28 minutos de acceso total y sin restricciones a la Consejera Osiris, el Diario de Sueños y todas las herramientas de la Sombra. Úsalo para tener tu primera gran revelación. Cuando el tiempo expire, podrás decidir si deseas continuar tu iniciación.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleStartTrial}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Comenzar mi Ciclo de Prueba
              </button>
              <button
                onClick={() => {
                  setShowTrialPopup(false);
                  setPendingView(null);
                }}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
