import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AppView } from '../types';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  firebaseUser: FirebaseUser | null;
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

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
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

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const userRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Siempre usamos los datos de Firestore si existen
            const userData: UserProfile = {
              name: data.name || fbUser.displayName || 'Viajera Lunar',
              birthDate: data.birthDate || '',
              lastPeriodDate: data.lastPeriodDate || '',
              cycleLength: data.cycleLength || 28,
              email: data.email || fbUser.email || '',
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              isPremium: data.isPremium ?? false,
              hasBook: data.hasBook ?? false,
              trialStartTime: data.trialStartTime ?? undefined,
            };
            if (isMounted) {
              setUser(userData);
            }
          } else {
            // Usuario nuevo - crear documento inicial
            const initialData = {
              name: fbUser.displayName || 'Viajera Lunar',
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || '',
              isPremium: false,
              hasBook: false,
              trialStartTime: null,
              profileComplete: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, initialData);
            if (isMounted) {
              setUser({
                name: initialData.name,
                birthDate: '',
                lastPeriodDate: '',
                cycleLength: 28,
                email: initialData.email,
                avatarUrl: initialData.avatarUrl || undefined,
                isPremium: false,
                hasBook: false,
                trialStartTime: undefined,
              });
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error en autenticación:', error);
        if (fbUser && isMounted) {
          setUser({
            name: fbUser.displayName || 'Viajera Lunar',
            birthDate: '',
            lastPeriodDate: '',
            cycleLength: 28,
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || undefined,
            isPremium: false,
            hasBook: false,
            trialStartTime: undefined,
          });
        } else if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setFirebaseUser(fbUser);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
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
        firebaseUser,
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
