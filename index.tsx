import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import './index.css';

// Componentes
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import DreamJournal from './components/DreamJournal';
import Chatbot from './components/Chatbot';
import Community from './components/Community';
import Glossary from './components/Glossary';
import UserProfileEdit from './components/UserProfileEdit';
import Inbox from './components/Inbox';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios en tiempo real (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // PANTALLA DE CARGA (El Semáforo)
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-pink-800 font-serif animate-pulse">Conectando con tu energía...</p>
        </div>
      </div>
    );
  }

  // SI NO HAY SESIÓN -> LOGIN
  if (!session) {
    return <Login />;
  }

  // SI HAY SESIÓN -> APP COMPLETA
  return (
    <Layout onLogout={() => supabase.auth.signOut()}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/dreams" element={<DreamJournal />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/community" element={<Community />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/profile" element={<UserProfileEdit />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);