import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Flower } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        lastPeriodDate: '',
        cycleLength: 28,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    name: user.user_metadata.full_name || '',
                }));
            }
        };
        getUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updates = {
            id: user.id,
            full_name: formData.name,
            birth_date: formData.birthDate,
            last_period_date: formData.lastPeriodDate,
            cycle_length: formData.cycleLength,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) {
            console.error('Error saving profile:', error);
            alert('Error al guardar el perfil. Intenta de nuevo.');
        } else {
            onComplete();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-pink-100 rounded-full text-pink-600">
                            <Flower size={40} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-serif text-pink-900 font-bold">Bienvenida, Diosa</h2>
                    <p className="text-gray-600 mt-2">Para calibrar tu brújula lunar, necesitamos algunos detalles sobre tu ciclo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Místico / Apodo</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                        <input
                            required
                            type="date"
                            style={{ colorScheme: 'light' }}
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Última Menstruación</label>
                            <input
                                required
                                type="date"
                                style={{ colorScheme: 'light' }}
                                value={formData.lastPeriodDate}
                                onChange={(e) => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duración Ciclo</label>
                            <input
                                required
                                type="number"
                                min="20"
                                max="45"
                                value={formData.cycleLength}
                                onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 rounded-lg shadow-md transition-all mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Comenzar Viaje'}
                    </button>
                </form>
            </div>
        </div>
    );
}
