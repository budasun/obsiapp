import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Save, User, Calendar, Droplet, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileEditProps {
  user?: UserProfile;
  onUpdate?: (updatedUser: UserProfile) => void;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    birthDate: '',
    lastPeriodDate: '',
    cycleLength: 28,
    email: '',
    avatarUrl: ''
  });
  const [loading, setLoading] = useState(!user);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setFormData({
          name: profile.full_name,
          birthDate: profile.birth_date,
          lastPeriodDate: profile.last_period_date,
          cycleLength: profile.cycle_length,
          email: authUser.email || '',
          avatarUrl: profile.avatar_url
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (onUpdate) {
        onUpdate(formData);
      } else {
        // Update Supabase directly
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const updates = {
            id: user.id,
            full_name: formData.name,
            birth_date: formData.birthDate,
            last_period_date: formData.lastPeriodDate,
            cycle_length: formData.cycleLength,
            updated_at: new Date(),
          };
          await supabase.from('profiles').upsert(updates);
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-gray-500">Cargando perfil...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8">
      <header className="text-center">
        <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Tu Perfil Sagrado</h2>
        <p className="text-gray-600">Actualiza tus datos para recalcular tus ciclos y fases.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-obsidian-100 overflow-hidden">
        {/* Banner / Avatar Section */}
        <div className="bg-obsidian-100 h-32 relative">
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-obsidian-300 flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{formData.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-200">
                <Camera size={14} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-2 text-obsidian-500" />
                Nombre o Apodo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-obsidian-200 outline-none text-gray-900 bg-white"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-2 text-obsidian-500" />
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                style={{ colorScheme: 'light' }}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-obsidian-200 outline-none text-gray-900 bg-white"
              />
            </div>

            {/* Last Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Droplet size={16} className="mr-2 text-red-400" />
                Última Menstruación
              </label>
              <input
                type="date"
                style={{ colorScheme: 'light' }}
                value={formData.lastPeriodDate}
                onChange={(e) => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-obsidian-200 outline-none text-gray-900 bg-white"
              />
            </div>

            {/* Cycle Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración del Ciclo (Días)
              </label>
              <input
                type="number"
                min="20"
                max="45"
                value={formData.cycleLength}
                onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-obsidian-200 outline-none text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Promedio habitual: 28 días</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-sm font-medium transition-opacity duration-300 ${isSaved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
              ¡Cambios guardados con éxito!
            </span>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Save size={18} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserProfileEdit;
