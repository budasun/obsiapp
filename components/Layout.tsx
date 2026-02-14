
import React from 'react';
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
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, user, onLogout }) => {
  if (!user && currentView === AppView.LOGIN) {
    return <>{children}</>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === view
        ? 'bg-obsidian-200 text-obsidian-900 shadow-sm'
        : 'text-gray-600 hover:bg-obsidian-50 hover:text-obsidian-700'
        }`}
    >
      <Icon size={20} />
      <span className="font-sans font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-obsidian-gradient overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-obsidian-100 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-obsidian-50 flex items-center space-x-2">
          <div className="p-2 bg-obsidian-100 rounded-full">
            <Egg className="text-[#E4007C] fill-[#E4007C]" size={24} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-obsidian-900 tracking-tight">Obsidiana</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem view={AppView.DASHBOARD} icon={Moon} label="Mi Ciclo Lunar" />
          <NavItem view={AppView.AGENDA} icon={Calendar} label="Mi Agenda" />
          <NavItem view={AppView.DREAMS} icon={BookHeart} label="Diario de Sueños" />
          <NavItem view={AppView.CHATBOT} icon={MessageCircleHeart} label="Consejera Osiris" />
          <NavItem view={AppView.COMMUNITY} icon={Users} label="Comunidad" />
          <NavItem view={AppView.GLOSSARY} icon={BookOpen} label="Glosario" />
        </nav>

        <div className="p-4 border-t border-obsidian-50">
          <button
            onClick={() => onChangeView(AppView.PROFILE)}
            className={`w-full mb-3 flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${currentView === AppView.PROFILE ? 'bg-obsidian-100' : 'hover:bg-gray-50'}`}
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
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-obsidian-100 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Egg className="text-[#E4007C] fill-[#E4007C]" size={24} />
          <span className="font-serif text-xl font-bold text-obsidian-900">Obsidiana</span>
        </div>
        <button onClick={() => onChangeView(AppView.PROFILE)} className="text-obsidian-900">
          <User size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative md:pt-0 pt-16">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-obsidian-100 flex justify-around p-3 z-20">
          <button onClick={() => onChangeView(AppView.DASHBOARD)} className={`${currentView === AppView.DASHBOARD ? 'text-obsidian-600' : 'text-gray-400'}`}><Moon /></button>
          <button onClick={() => onChangeView(AppView.AGENDA)} className={`${currentView === AppView.AGENDA ? 'text-obsidian-600' : 'text-gray-400'}`}><Calendar /></button>
          <button onClick={() => onChangeView(AppView.CHATBOT)} className={`${currentView === AppView.CHATBOT ? 'text-obsidian-600' : 'text-gray-400'}`}><MessageCircleHeart /></button>
          <button onClick={() => onChangeView(AppView.COMMUNITY)} className={`${currentView === AppView.COMMUNITY ? 'text-obsidian-600' : 'text-gray-400'}`}><Users /></button>
        </div>
      </main>
    </div>
  );
};

export default Layout;
