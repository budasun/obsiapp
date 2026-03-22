import React, { useState, useEffect } from 'react';
import { UserProfile, AppView } from '../types';
import { Flower, Star, Loader2 } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { validateUserProfile } from '../utils/validation';
import { useApp } from '../context/AppContext';

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
  const { refreshSession } = useApp();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfileAndCheck(session.user.id, session.user);
      }
    });
  }, []);

  const loadProfileAndCheck = async (userId: string, authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verificando perfil:', error);
        return;
      }

      if (profile) {
        if (!profile.profile_complete || !profile.birth_date || !profile.last_period_date) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || authUser.user_metadata?.full_name || '',
            email: profile.email || authUser.email || '',
            avatarUrl: profile.avatar_url || authUser.user_metadata?.avatar_url || '',
            birthDate: profile.birth_date || '',
            lastPeriodDate: profile.last_period_date || '',
            cycleLength: profile.cycle_length || 28,
          }));
          setStep('profile');
        }
      } else {
        setFormData(prev => ({
          ...prev,
          name: authUser.user_metadata?.full_name || '',
          email: authUser.email || '',
          avatarUrl: authUser.user_metadata?.avatar_url || '',
        }));
        setStep('profile');
      }
    } catch (err) {
      console.error('Error verificando perfil:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validación básica para el paso 1 (solo email, password y nombre)
    if (!formData.email || !formData.password) {
      setError('El email y la contraseña son obligatorios.');
      setIsLoading(false);
      return;
    }

    if (step === 'register' && !formData.name) {
      setError('El nombre es obligatorio para crear tu cuenta.');
      setIsLoading(false);
      return;
    }

    try {
      if (step === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });

        if (signUpError) throw signUpError;

        // CORRECCIÓN: Si el registro es exitoso, pasamos al paso de perfil, NO al dashboard.
        if (data.user) {
          setStep('profile');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile?.profile_complete && profile.birth_date && profile.last_period_date) {
            const fullUser: UserProfile = {
              name: profile.full_name || data.user.user_metadata?.full_name || 'Viajera Lunar',
              birthDate: profile.birth_date,
              lastPeriodDate: profile.last_period_date,
              cycleLength: profile.cycle_length || 28,
              email: profile.email || data.user.email || '',
              avatarUrl: profile.avatar_url || data.user.user_metadata?.avatar_url || undefined,
              isPremium: profile.is_premium ?? false,
              hasBook: profile.has_book ?? false,
              trialStartTime: profile.trial_start_time ?? undefined,
            };
            onLogin(fullUser);
            await refreshSession();
            onNavigate(AppView.DASHBOARD);
            return;
          }
        }
        // Si falta info, lo mandamos a completar el perfil
        setStep('profile');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message?.includes('Email not confirmed')) {
        setError('Email no confirmado. Revisa tu bandeja de entrada.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos');
      } else if (err.message?.includes('already registered')) {
        setError('Este email ya está registrado');
      } else {
        setError(`Error: ${err.message || 'desconocido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (userId: string, profileComplete: boolean) => {
    const profileData = {
      id: userId,
      email: formData.email,
      full_name: formData.name || 'Viajera Lunar',
      birth_date: formData.birthDate,
      last_period_date: formData.lastPeriodDate,
      cycle_length: formData.cycleLength,
      avatar_url: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=fbcfe8&color=831843`,
      profile_complete: profileComplete,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error('Error guardando perfil:', error);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Aquí SÍ hacemos la validación rigurosa porque ya están en el paso de fechas
    const validation = validateUserProfile({
      name: formData.name,
      email: formData.email,
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
      avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=fbcfe8&color=831843`,
      isPremium: false,
      hasBook: false,
      trialStartTime: undefined
    };

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await saveProfile(authUser.id, true);
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
    }

    onLogin(user);
    await refreshSession();
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

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {step === 'register' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre Místico / Apodo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-obsidian-300 focus:border-transparent outline-none text-gray-900 bg-white"
                    />
                  </div>
                )}
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
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
                  {step === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
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

              {/* Si el usuario no puso nombre en el paso anterior, se lo pedimos de nuevo por si acaso */}
              {!formData.name && (
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
              )}

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