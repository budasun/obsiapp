import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Calendar, BookHeart, MessageCircle, Users, BookOpen, LogOut, Menu, X } from 'lucide-react';

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
    { icon: BookHeart, label: 'Diario de Sueños', path: '/dreams' },
    { icon: MessageCircle, label: 'Consejera Osiris', path: '/chat' },
    { icon: Users, label: 'Comunidad', path: '/community' },
    { icon: BookOpen, label: 'Glosario', path: '/glossary' },
  ];

  return (
    // Contenedor principal: Usa 100dvh para evitar problemas con barras de navegador móvil
    <div className="flex h-[100dvh] bg-pink-50 overflow-hidden relative">
      
      {/* Botón Flotante para abrir menú en móvil */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm p-4 flex items-center justify-between border-b border-pink-100 shadow-sm h-16">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-pink-600 rounded-full"></div>
           <span className="font-bold text-pink-900">Obsidiana</span>
        </div>
        <button 
          className="p-2 bg-pink-100 rounded-full text-pink-600 active:scale-95 transition-transform"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Menú Lateral) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-pink-100 
        transform transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        flex flex-col h-full
        md:relative md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Cabecera del Menú */}
        <div className="p-6 flex items-center gap-3 border-b border-pink-50 h-20 md:h-auto">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center shadow-md">
            <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-pink-900">Obsidiana</h1>
          {/* Botón cerrar dentro del menú para móvil */}
          <button 
            className="md:hidden ml-auto text-gray-400"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20}/>
          </button>
        </div>

        {/* Lista de Navegación (Aquí está el arreglo del scroll) */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-200' 
                    : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-pink-400 group-hover:text-pink-600'} />
                <span className="font-medium text-sm md:text-base">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Espacio extra al final para asegurar que se vea todo */}
          <div className="h-12 md:hidden"></div>
        </nav>

        {/* Footer del Menú (Fijo abajo) */}
        <div className="p-4 border-t border-pink-100 bg-gray-50">
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
      <main 
        className="flex-1 overflow-y-auto w-full h-full pt-16 md:pt-0 bg-white md:bg-pink-50 scroll-smooth"
        onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-full pb-32">
          {children}
        </div>
      </main>

      {/* Fondo oscuro cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-[2px]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
