import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import DreamJournal from './components/DreamJournal';
import Chatbot from './components/Chatbot';
import Community from './components/Community';
import Glossary from './components/Glossary';
import UserProfileEdit from './components/UserProfileEdit';
import Agenda from './components/Agenda';
import { AppView, UserProfile } from './types';

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogout = () => {
    setUser(null);
    setCurrentView(AppView.LOGIN);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.LOGIN:
        return <Login onLogin={setUser} onNavigate={setCurrentView} />;
      case AppView.DASHBOARD:
        return user ? <Dashboard user={user} /> : null;
      case AppView.DREAMS:
        return <DreamJournal />;
      case AppView.CHATBOT:
        return <Chatbot />;
      case AppView.COMMUNITY:
        return <Community />;
      case AppView.GLOSSARY:
        return <Glossary />;
      case AppView.PROFILE:
        return user ? <UserProfileEdit user={user} onUpdate={handleUpdateUser} /> : null;
      case AppView.AGENDA:
        return <Agenda />;
      default:
        return user ? <Dashboard user={user} /> : <Login onLogin={setUser} onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}