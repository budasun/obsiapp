import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Importamos tus componentes
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import DreamJournal from './components/DreamJournal';
import Chatbot from './components/Chatbot';
import Community from './components/Community';
import Glossary from './components/Glossary';
import Login from './components/Login';
import Onboarding from './components/Onboarding';

import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Componente principal que organiza las rutas
const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await checkProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('birth_date, last_period_date')
        .eq('id', userId)
        .single();

      if (data && data.birth_date && data.last_period_date) {
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
      }
    } catch (e) {
      console.error('Error verifying profile:', e);
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-700">Cargando magia...</div>;
  }

  if (!session) {
    return <Login onLogin={() => { }} onNavigate={() => { }} />;
  }

  if (!profileComplete) {
    return <Onboarding onComplete={() => setProfileComplete(true)} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/dreams" element={<DreamJournal />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/community" element={<Community />} />
        <Route path="/glossary" element={<Glossary />} />
        {/* Ruta por defecto si se pierde */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
};

// Renderizado final
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
