import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Flower, Star, Loader2 } from 'lucide-react';

const LoginSupabase: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lógica de sincronización garantizada
    React.useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const { user } = session;
                
                // Intentamos insertar o actualizar el perfil
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata.full_name || user.user_metadata.name,
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error("Error al sincronizar perfil:", profileError.message);
                } else {
                    console.log("Perfil sincronizado correctamente");
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consensus',
                    },
                },
            });

            if (authError) throw authError;

            // Nota: En Supabase, tras el login exitoso por OAuth, el navegador será redirigido.
            // La lógica de inserción/actualización de 'profiles' es mejor manejarla
            // con un "Trigger" en la base de datos de Supabase para robustez total, 
            // pero incluimos aquí un chequeo post-auth por si acaso.
            
        } catch (err: any) {
            console.error("Error en Login:", err);
            setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white overflow-hidden transition-all hover:shadow-pink-100">
                <div className="bg-obsidian-900 p-10 text-center relative overflow-hidden">
                    {/* Estética Premium: Micro-animaciones y gradientes */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <Flower className="absolute -top-10 -left-10 w-40 h-40 animate-spin-slow text-white" />
                        <Star className="absolute bottom-10 right-10 w-20 h-20 animate-pulse text-white" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-serif text-white font-bold mb-3 tracking-tight">Obsidiana</h1>
                        <p className="text-pink-100/80 font-sans text-sm tracking-widest uppercase">Viaje al útero sagrado</p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="text-center space-y-2">
                        <p className="text-gray-600 font-sans leading-relaxed">
                            Sincroniza tu sabiduría biológica con los ciclos celestes.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full group relative flex items-center justify-center space-x-4 bg-white border border-gray-100 hover:border-obsidian-200 text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <span className="text-lg">
                            {isLoading ? (
                                <Loader2 className="animate-spin w-6 h-6 text-obsidian-600" />
                            ) : (
                                'Continuar con Google'
                            )}
                        </span>
                        
                        {/* Efecto de brillo al hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>

                    <p className="text-center text-xs text-gray-400 font-sans">
                        Al continuar, aceptas nuestras políticas de sabiduría ancestral y privacidad.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginSupabase;
