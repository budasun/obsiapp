import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
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

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sesión activa al iniciar
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. Estado de Carga (El Semáforo)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-obsidian-700 mx-auto mb-4"></div>
          <p className="text-obsidian-700 font-serif text-lg">Sincronizando con el Oráculo...</p>
        </div>
      </div>
    );
  }

  // 2. Si hay sesión -> App Principal
  if (session) {
    return (
      <Layout onLogout={() => supabase.auth.signOut()}>
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

  // 3. Si NO hay sesión -> Login
  return (
    <Login
      onLogin={() => { }} // El cambio de estado lo maneja el listener de supabase
      onNavigate={() => { }}
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
