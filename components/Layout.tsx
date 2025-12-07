import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Calendar, BookOpen, MessageCircle, Users, LogOut, BookHeart, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: Moon, label: 'Mi Ciclo Lunar', path: '/' },
    { icon: Calendar, label: 'Mi Agenda', path: '/agenda' },
    { icon: BookHeart, label: 'Diario de Sueños', path: '/dreams' }, // Icono corregido
    { icon: MessageCircle, label: 'Consejera Osiris', path: '/chat' },
    { icon: Users, label: 'Comunidad', path: '/community' },
    { icon: BookOpen, label: 'Glosario', path: '/glossary' },
  ];

  return (
    <div className="flex h-screen bg-pink-50 overflow-hidden">
      
      {/* Botón de Menú Móvil (Hamburguesa) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md text-pink-600"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar (Menú Lateral) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-pink-100 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-pink-900">Obsidiana</h1>
          </div>

          {/* Lista de Menú con SCROLL (La solución está aquí: overflow-y-auto) */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-20">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)} // Cierra menú al hacer clic en móvil
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-pink-50 text-pink-700 font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-600'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer del Menú (Usuario y Logout) */}
          <div className="p-4 border-t border-pink-100 bg-white">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 text-pink-400 hover:text-pink-600 w-full rounded-xl hover:bg-pink-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto w-full" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>
        <div className="max-w-5xl mx-auto p-4 md:p-8 pt-16 md:pt-8 pb-24">
          {children}
        </div>
      </main>

      {/* Overlay Oscuro para móvil cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
