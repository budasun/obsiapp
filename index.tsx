import React, { Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, useApp } from './context/AppContext';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Login from './components/Login';
import Layout from './components/Layout';
import { AppView } from './types';
import './i18n/translations';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const DreamJournal = React.lazy(() => import('./components/DreamJournal'));
const Chatbot = React.lazy(() => import('./components/Chatbot'));
const Community = React.lazy(() => import('./components/Community'));
const Glossary = React.lazy(() => import('./components/Glossary'));
const UserProfileEdit = React.lazy(() => import('./components/UserProfileEdit'));
const Agenda = React.lazy(() => import('./components/Agenda'));
const Messages = React.lazy(() => import('./components/Messages'));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner text="Cargando página..." />
  </div>
);

const AppContent: React.FC = () => {
  const { user, setUser, currentView, setCurrentView, isLoading, isOnline, handleLogout } = useApp();

  useEffect(() => {
    if (user && currentView === AppView.LOGIN) {
      setCurrentView(AppView.DASHBOARD);
    } else if (!user && currentView !== AppView.LOGIN) {
      setCurrentView(AppView.LOGIN);
    }
  }, [user, currentView, setCurrentView]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Inicializando Obsidiana..." />;
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.LOGIN:
        return <Login onLogin={setUser} onNavigate={setCurrentView} />;
      case AppView.DASHBOARD:
        return user ? (
          <Suspense fallback={<PageLoader />}>
            <Dashboard user={user} />
          </Suspense>
        ) : null;
      case AppView.DREAMS:
        return (
          <Suspense fallback={<PageLoader />}>
            <DreamJournal />
          </Suspense>
        );
      case AppView.CHATBOT:
        return (
          <Suspense fallback={<PageLoader />}>
            <Chatbot />
          </Suspense>
        );
      case AppView.COMMUNITY:
        return user ? (
          <Suspense fallback={<PageLoader />}>
            <Community user={user} />
          </Suspense>
        ) : null;
      case AppView.GLOSSARY:
        return (
          <Suspense fallback={<PageLoader />}>
            <Glossary />
          </Suspense>
        );
      case AppView.PROFILE:
        return user ? (
          <Suspense fallback={<PageLoader />}>
            <UserProfileEdit user={user} onUpdate={setUser} />
          </Suspense>
        ) : null;
      case AppView.AGENDA:
        return (
          <Suspense fallback={<PageLoader />}>
            <Agenda />
          </Suspense>
        );
      case AppView.MESSAGES:
        return user ? (
          <Suspense fallback={<PageLoader />}>
            <Messages user={user} />
          </Suspense>
        ) : null;
      default:
        return user ? (
          <Suspense fallback={<PageLoader />}>
            <Dashboard user={user} />
          </Suspense>
        ) : (
          <Login onLogin={setUser} onNavigate={setCurrentView} />
        );
    }
  };

  if (!user && currentView === AppView.LOGIN) {
    return <Login onLogin={setUser} onNavigate={setCurrentView} />;
  }

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

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <OfflineBanner />
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
