import React from 'react';
import { supabase } from '../lib/supabase';
import { Flower } from 'lucide-react';

const Login = () => {
    const handleGoogleLogin = async () => {
        // Usamos window.location.origin para que funcione tanto en localhost como en vercel
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <Flower className="w-16 h-16 text-pink-600 animate-spin-slow" />
                </div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">ObsiApp</h1>
                <p className="text-gray-500 mb-8">Tu viaje de retorno al útero sagrado</p>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                    <img src="[https://www.google.com/favicon.ico](https://www.google.com/favicon.ico)" alt="Google" className="w-5 h-5" />
                    <span>Continuar con Google</span>
                </button>
            </div>
        </div>
    );
};

export default Login;