import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Calendar, BookHeart, MessageCircle, Users, BookOpen, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

import { supabase } from '../lib/supabase';

interface UserProfile {
  full_name: string;
  avatar_url: string;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setProfile({
          full_name: user.user_metadata.full_name || 'Viajera Lunar',
          avatar_url: user.user_metadata.avatar_url || '',
        });
      }
    });
  }, []);

  const menuItems = [
    { icon: Moon, label: 'Mi Ciclo Lunar', path: '/' },
    { icon: Calendar, label: 'Mi Agenda', path: '/agenda' },
    { icon: BookHeart, label: 'Diario de Sueños', path: '/dreams' },
    { icon: MessageCircle, label: 'Consejera Osiris', path: '/chat' },
    { icon: Users, label: 'Comunidad', path: '/community' },
    { icon: BookOpen, label: 'Glosario', path: '/glossary' },
  ];

  return (
    <div className="flex h-[100dvh] bg-pink-50 overflow-hidden relative">

      {/* Botón Flotante (Hamburguesa) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm p-4 flex items-center justify-between border-b border-pink-100 h-16 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-pink-600 rounded-full"></div>
          <span className="font-bold text-pink-900 font-serif">ObsiApp</span>
        </div>
        <button
          className="p-2 bg-pink-100 rounded-full text-pink-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú Lateral (Sidebar) */}
      < aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-pink-100 
        transform transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        flex flex-col h-full pt-16 md:pt-0
        md:relative md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Desktop */}
        < div className="hidden md:flex p-6 items-center gap-3 h-20" >
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-pink-900">ObsiApp</h1>
        </div >

        {/* Lista de Navegación con Scroll */}
        < nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar pb-32" >
          {
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                    : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                    }`}
                >
                  <Icon size={22} className={isActive ? 'text-white' : 'text-pink-400'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })
          }
        </nav >

        {/* Footer del Menú */}
        <div className="p-4 border-t border-pink-100 bg-white">
          {profile && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border border-pink-200" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">{profile.full_name}</p>
                <p className="text-xs text-pink-500">Conectada</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 w-full rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      < main
        className="flex-1 overflow-y-auto w-full h-full pt-16 md:pt-0 bg-pink-50 scroll-smooth"
        onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
          {children}
        </div>
      </main >

      {/* Fondo oscuro móvil */}
      {
        isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )
      }
    </div >
  );
}
