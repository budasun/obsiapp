Actúa como un Desarrollador Senior React.
El build de Vercel está fallando por "Unused vars"(variables no usadas).
Corrige el archivo`src/index.tsx`.

** TU MISIÓN:**
  1.  Elimina la importación de`Login`(ya que no la usamos).
2.  Elimina cualquier otra importación que no se esté usando en el JSX.
3.  Asegúrate de que el código quede limpio y funcional.

** CÓDIGO CORRECTO(Para src / index.tsx):**

  ```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Componentes (Solo los que se usan en las rutas)
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
  // Lógica de "Logout" simulada
  const handleLogout = () => {
    window.location.href = '/';
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