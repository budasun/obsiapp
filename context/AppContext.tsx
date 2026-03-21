import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AppView } from '../types';
import { supabase } from '../src/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  session: Session | null;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isLoading: boolean;
  isOnline: boolean;
  bookUnlocked: boolean;
  setBookUnlocked: (unlocked: boolean) => void;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [bookUnlocked, setBookUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('obsidiana_book_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted || hasLoaded) return;
        hasLoaded = true;
        
        if (error) {
          console.error('Error en getSession:', error);
          setUser(null);
          setCurrentView(AppView.LOGIN);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setCurrentView(AppView.LOGIN);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error en initAuth:', err);
        if (isMounted) {
          setUser(null);
          setCurrentView(AppView.LOGIN);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || !hasLoaded) return;
        
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentView(AppView.LOGIN);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadUserProfile(session.user);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (isMounted && hasLoaded === false) {
        console.warn('Timeout en getSession, forzando salida de loading');
        hasLoaded = true;
        setUser(null);
        setCurrentView(AppView.LOGIN);
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      hasLoaded = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando perfil:', error);
        setUser(null);
        setCurrentView(AppView.LOGIN);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const profileIsComplete = profile.profile_complete && profile.birth_date && profile.last_period_date;

        const userData: UserProfile = {
          name: profile.full_name || authUser.user_metadata?.full_name || 'Viajera Lunar',
          birthDate: profile.birth_date || '',
          lastPeriodDate: profile.last_period_date || '',
          cycleLength: profile.cycle_length || 28,
          email: profile.email || authUser.email || '',
          avatarUrl: profile.avatar_url || authUser.user_metadata?.avatar_url || undefined,
          isPremium: profile.is_premium ?? false,
          hasBook: profile.has_book ?? false,
          trialStartTime: profile.trial_start_time ?? undefined,
        };

        if (profile.has_book) {
          setBookUnlocked(true);
        }

        if (profileIsComplete) {
          setUser(userData);
          setCurrentView(AppView.DASHBOARD);
        } else {
          setUser(null);
          setCurrentView(AppView.LOGIN);
        }
      } else {
        setUser(null);
        setCurrentView(AppView.LOGIN);
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      setUser(null);
      setCurrentView(AppView.LOGIN);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('obsidiana_book_unlocked', bookUnlocked.toString());
  }, [bookUnlocked]);

  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session?.user) {
        refreshTimeout = setTimeout(async () => {
          console.log('🔄 Refrescando perfil después de regreso de Stripe/pago...');
          await loadUserProfile(session.user);
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [session]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentView(AppView.LOGIN);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        session,
        currentView,
        setCurrentView,
        isLoading,
        isOnline,
        bookUnlocked,
        setBookUnlocked,
        handleLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
