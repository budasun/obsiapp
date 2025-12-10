import React from 'react';
import { supabase } from '../lib/supabase';
import { Flower } from 'lucide-react';

const Login = () => {
    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin, // Dinamico: localhost o Vercel
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error crítico de login:", error);
            alert("Error al conectar con Google. Intenta de nuevo.");
        }
    };

    return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <Flower className="w-16 h-16 text-pink-600 animate-spin-slow" />
                </div>
                <h1 className="text-3xl font-serif text-pink-900 mb-2">ObsiApp</h1>
                <p className="text-gray-500 mb-8">Sanación Uterina y Ciclo Lunar</p>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm"
                >
                    <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
                    <span>Continuar con Google</span>
                </button>
            </div>
        </div>
    );
};

export default Login;