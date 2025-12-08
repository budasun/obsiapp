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

// Componente principal que organiza las rutas
const App = () => {
  // Aquí podrías poner lógica para verificar si está logueado
  // Por ahora, asumimos que sí para que veas la app funcionar
  const isAuthenticated = true; 

  if (!isAuthenticated) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <Layout onLogout={() => console.log("Cerrar sesión")}>
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
    {/* BrowserRouter es el motor que hace funcionar los enlaces */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
