import React, { ReactNode, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../i18n/translations';
import { AppView } from '../types';

interface Props {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error('Error caught by boundary:', err);
    setError(err);
  }, []);

  React.useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason || new Error('Unhandled promise rejection'));
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return <>{children}</>;
};

const ErrorFallback: React.FC<{ error: Error | null }> = ({ error }) => {
  const { setCurrentView } = useApp();
  const t = translations.es.errors;

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    setCurrentView(AppView.DASHBOARD);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-obsidian-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-obsidian-900 mb-2">
          {t.generic}
        </h1>

        <p className="text-gray-600 mb-6">
          {error?.message || 'Ha ocurrido un error inesperado'}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-obsidian-600 hover:bg-obsidian-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
            Reintentar
          </button>

          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Home size={20} />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
