import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import './index.css';

// Componentes
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import DreamJournal from './components/DreamJournal';
import Chatbot from './components/Chatbot';
import Community from './components/Community';
import Glossary from './components/Glossary';
import Login from './components/Login';

// Supabase y Servicios
import { supabase } from './lib/supabase';
import { UserProfile, AppView } from './types';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Función auxiliar para obtener el perfil completo
  const fetchProfile = async (userId: string, currentSession: Session) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const mappedProfile: UserProfile = {
          name: profile.full_name,
          birthDate: profile.birth_date,
          lastPeriodDate: profile.last_period_date,
          cycleLength: profile.cycle_length,
          email: profile.email || currentSession.user.email || '',
          avatarUrl: profile.avatar_url
        };
        setUserProfile(mappedProfile);
        setSession(currentSession);
      } else {
        // Si no hay perfil, el usuario debe completarlo en Login step 2
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Verificación Inicial
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          await fetchProfile(session.user.id, session);
        } else {
          setSession(null);
          setUserProfile(null);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error initializing session:', e);
        setLoading(false);
      }
    };

    initSession();

    // 2. Suscripción a cambios en Auth (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        // Recargar perfil al iniciar sesión
        setLoading(true);
        await fetchProfile(newSession.user.id, newSession);
      } else if (event === 'SIGNED_OUT') {
        // Limpiar todo al salir
        setSession(null);
        setUserProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // El listener 'SIGNED_OUT' manejará el estado
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    // Actualización optimista desde el componente Login
    setUserProfile(profile);
    setLoading(false);
  };

  // Renderizado Condicional
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-obsidian-700 mb-4"></div>
        <p className="text-obsidian-700 font-serif">Cargando ObsiApp...</p>
      </div>
    );
  }

  // Si hay Session Y Perfil -> App Principal
  if (session && userProfile) {
    return (
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/dreams" element={<DreamJournal />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/community" element={<Community />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    );
  }

  // Si NO hay sesión O NO hay perfil completo -> Login
  return (
    <Login
      onLogin={handleLoginSuccess}
      onNavigate={() => {
        // La navegación es implícita al cambiar el estado userProfile
        // pero podemos mantenerlo como placeholder o log
        console.log('Navigating to dashboard...');
      }}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
