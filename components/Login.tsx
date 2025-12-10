import React, { useState, useEffect } from 'react';
import { UserProfile, AppView } from '../types';
import { Flower, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
    onLogin: (user: UserProfile) => void;
    onNavigate: (view: AppView) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        lastPeriodDate: '',
        cycleLength: 28,
        email: '',
        avatarUrl: ''
    });

    useEffect(() => {
        const handleAuthCheck = async (session: any) => {
            if (!session?.user) return;

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    // Caso A: Perfil existe -> Login directo
                    const userProfile: UserProfile = {
                        name: profile.full_name,
                        birthDate: profile.birth_date,
                        lastPeriodDate: profile.last_period_date,
                        cycleLength: profile.cycle_length,
                        email: profile.email || session.user.email || '',
                        avatarUrl: profile.avatar_url
                    };
                    onLogin(userProfile);
                    onNavigate(AppView.DASHBOARD);
                } else if (error && error.code === 'PGRST116') {
                    // Caso B: Perfil NO existe (código específico de Supabase) -> Completar registro
                    setStep(2);
                } else {
                    // Caso C: Otro error (conexión, etc) -> Mantenerse en login
                    console.error('Error checking profile:', error);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        // 1. Verificar sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                handleAuthCheck(session);
            }
        });

        // 2. Suscribirse a cambios (incluyendo redirección OAuth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                handleAuthCheck(session);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [onLogin, onNavigate]);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin // Esto detecta automáticamente si es localhost o Vercel
            }
        });
        if (error) console.error('Error logging in:', error.message);
    };

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const updates = {
                id: user.id,
                full_name: formData.name || 'Viajera Lunar',
                birth_date: formData.birthDate,
                last_period_date: formData.lastPeriodDate,
                cycle_length: formData.cycleLength,
                avatar_url: user.user_metadata.avatar_url,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) {
                console.error('Error updating profile:', error);
            } else {
                const userProfile: UserProfile = {
                    name: updates.full_name,
                    birthDate: updates.birth_date,
                    lastPeriodDate: updates.last_period_date,
                    cycleLength: updates.cycle_length,
                    email: user.email,
                    avatarUrl: updates.avatar_url
                };
                onLogin(userProfile);
                onNavigate(AppView.DASHBOARD);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-obsidian-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-obsidian-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <Flower className="absolute top-[-20px] left-[-20px] w-32 h-32 animate-spin-slow" />
                        <Star className="absolute bottom-10 right-10 w-16 h-16" />
                    </div>
                    <h1 className="text-3xl font-serif text-white font-bold mb-2 relative z-10">ObsiApp</h1>
                    <p className="text-obsidian-200 font-sans relative z-10">Tu viaje de retorno al útero sagrado</p>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <p className="text-center text-gray-600 mb-8">Inicia sesión para sincronizar tu ciclo biológico con la sabiduría lunar.</p>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Continuar con Google</span>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Holística & Privada</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitProfile} className="space-y-5 animate-fade-in">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-serif text-obsidian-900">Configura tu Reloj Biológico</h2>
                                <p className="text-sm text-gray-500">Para calcular tu reserva creativa y fases lunares</p>
                            </div>

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
                                        onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) })}
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
