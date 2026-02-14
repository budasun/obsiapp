
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
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user && currentView === AppView.LOGIN) {
    return <>{children}</>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === view
        ? 'bg-obsidian-200 text-obsidian-900 shadow-sm'
        : 'text-gray-600 hover:bg-obsidian-50 hover:text-obsidian-700'
        }`}
    >
      <Icon size={20} />
      <span className="font-sans font-medium">{label}</span>
    </button>
  );

  const Navigation = () => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      <NavItem view={AppView.DASHBOARD} icon={Moon} label="Mi Ciclo Lunar" />
      <NavItem view={AppView.AGENDA} icon={Calendar} label="Mi Agenda" />
      <NavItem view={AppView.DREAMS} icon={BookHeart} label="Diario de Sueños" />
      <NavItem view={AppView.CHATBOT} icon={MessageCircleHeart} label="Consejera Osiris" />
      <NavItem view={AppView.COMMUNITY} icon={Users} label="Comunidad" />
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
              {user?.name.charAt(0)}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-gray-700 truncate">{user?.name}</p>
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
              {user?.name.charAt(0)}
            </div>
            <div className="text-left overflow-hidden">
              <p className="font-bold text-gray-800 truncate">{user?.name}</p>
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
    </div>
  );
};

export default Layout;
