
import React, { useState } from 'react';
import { UserProfile, AppView } from '../types';
import { Flower, Star, Loader2 } from 'lucide-react';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { validateUserProfile, validateEmail, validatePassword } from '../utils/validation';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onNavigate: (view: AppView) => void;
}

type AuthMode = 'login' | 'register' | 'profile';

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [step, setStep] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    lastPeriodDate: '',
    cycleLength: 28,
    email: '',
    password: '',
    avatarUrl: ''
  });

  const handleDemoLogin = () => {
    const demoUser: UserProfile = {
      name: 'Viajera Lunar',
      birthDate: '1990-01-15',
      lastPeriodDate: new Date().toISOString().split('T')[0],
      cycleLength: 28,
      email: 'demo@obsidiana.app',
      avatarUrl: 'https://ui-avatars.com/api/?name=Demo&background=fbcfe8&color=831843'
    };
    onLogin(demoUser);
    onNavigate(AppView.DASHBOARD);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        avatarUrl: user.photoURL || ''
      }));

      setStep('profile');
    } catch (err: any) {
      console.error("Error with Google Login:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Ventana cerrada. Inténtalo de nuevo.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Dominio no autorizado. Configura Firebase Console.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Error de conexión. Verifica tu internet.");
      } else {
        setError(`Error: ${err.code || 'desconocido'}. Revisa la consola.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const validation = validateUserProfile({
      name: formData.name,
      email: formData.email,
      birthDate: formData.birthDate,
      lastPeriodDate: formData.lastPeriodDate,
      cycleLength: formData.cycleLength
    });

    if (!validation.valid) {
      setError(Object.values(validation.errors)[0]);
      setIsLoading(false);
      return;
    }

    try {
      if (step === 'register') {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
          setError(passwordValidation.errors[0]);
          setIsLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      setStep('profile');
    } catch (err: any) {
      console.error("Auth error:", err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de conexión. Verifica tu internet.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Método de autenticación no habilitado en Firebase Console.');
      } else {
        setError(`Error: ${err.code || 'desconocido'}. Revisa la consola.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateUserProfile({
      name: formData.name,
      birthDate: formData.birthDate,
      lastPeriodDate: formData.lastPeriodDate,
      cycleLength: formData.cycleLength
    });

    if (!validation.valid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    const user: UserProfile = {
      name: formData.name || 'Viajera Lunar',
      birthDate: formData.birthDate,
      lastPeriodDate: formData.lastPeriodDate,
      cycleLength: formData.cycleLength,
      email: formData.email || 'user@example.com',
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=fbcfe8&color=831843`
    };
    onLogin(user);
    onNavigate(AppView.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-obsidian-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <Flower className="absolute top-[-20px] left-[-20px] w-32 h-32 animate-spin-slow" />
            <Star className="absolute bottom-10 right-10 w-16 h-16" />
          </div>
          <h1 className="text-3xl font-serif text-white font-bold mb-2 relative z-10">Obsidiana</h1>
          <p className="text-obsidian-200 font-sans relative z-10">Tu viaje de retorno al útero sagrado</p>
        </div>

        <div className="p-8">
          {step === 'login' || step === 'register' ? (
            <div className="space-y-6">
              <p className="text-center text-gray-700 font-sans leading-relaxed">
                {step === 'login' 
                  ? 'Inicia sesión para sincronizar tu sabiduría biológica con los ciclos celestes y guardar tu progreso en el tiempo.'
                  : 'Crea tu cuenta para comenzar tu viaje de sanación uterina.'}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-14 flex items-center justify-center space-x-4 bg-white border border-gray-200 hover:border-obsidian-300 text-gray-700 font-bold py-3 px-4 rounded-2xl transition-all transform hover:scale-[1.01] hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                <div className="bg-white p-2 rounded-lg">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <span>{isLoading ? <Loader2 className="animate-spin" /> : 'Acceder con Google'}</span>
              </button>

              <button
                onClick={handleDemoLogin}
                className="w-full h-12 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-95"
              >
                <span>Entrar como Invitado (Demo)</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-400 font-medium uppercase tracking-widest">o continúa con email</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {step === 'register' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                    />
                  </div>
                )}
                <input
                  type="email"
                  placeholder="Tu email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-obsidian-600 hover:bg-obsidian-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="animate-spin" size={20} />}
                  {step === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setStep(step === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                  className="text-obsidian-600 hover:text-obsidian-800 text-sm font-medium"
                >
                  {step === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitProfile} className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif text-obsidian-900">Configura tu Reloj Biológico</h2>
                <p className="text-sm text-gray-500">Para calcular tu reserva creativa y fases lunares</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Místico / Apodo</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="Ej. Hija de la Luna"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input
                  required
                  type="date"
                  style={{ colorScheme: 'light' }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última Menstruación</label>
                  <input
                    required
                    type="date"
                    style={{ colorScheme: 'light' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                    value={formData.lastPeriodDate}
                    onChange={(e) => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración Ciclo (días)</label>
                  <input
                    type="number"
                    min="20"
                    max="45"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                    value={formData.cycleLength}
                    onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) || 28 })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-obsidian-600 hover:bg-obsidian-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all mt-4"
              >
                Comenzar Viaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
