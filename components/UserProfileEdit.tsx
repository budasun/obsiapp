import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Save, User, Calendar, Droplet, Camera, ShieldCheck, KeyRound, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';

interface UserProfileEditProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingCover(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${authUser.id}/${type}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      if (type === 'avatar') {
        setFormData({ ...formData, avatarUrl: finalUrl });
      } else {
        setFormData({ ...formData, coverUrl: finalUrl });
      }
    } catch (error) {
      console.error(`Error subiendo ${type}:`, error);
      alert(`No se pudo subir la imagen de ${type}. Inténtalo de nuevo.`);
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            full_name: formData.name,
            avatar_url: formData.avatarUrl || null,
            cover_url: formData.coverUrl || null,
            birth_date: formData.birthDate,
            last_period_date: formData.lastPeriodDate,
            cycle_length: formData.cycleLength,
            email: formData.email,
            profile_complete: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }

      onUpdate(formData);
    } catch (error) {
      console.error("Error guardando perfil en Supabase:", error);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Ambos campos son obligatorios.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordSuccess('🔐 ¡Contraseña actualizada exitosamente!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error cambiando contraseña:', err);
      if (err.message?.includes('same password')) {
        setPasswordError('La nueva contraseña debe ser diferente a la actual.');
      } else if (err.message?.includes('should be different')) {
        setPasswordError('La nueva contraseña debe ser diferente a la actual.');
      } else {
        setPasswordError(`Error: ${err.message || 'No se pudo cambiar la contraseña.'}`);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <header className="text-center">
        <h2 className="text-4xl font-serif text-obsidian-900 mb-2">Tu Perfil Sagrado</h2>
        <p className="text-gray-500 font-medium">Actualiza tus datos para el círculo y tus ciclos.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl border border-obsidian-50 overflow-hidden transition-all duration-500 hover:shadow-2xl">
        <div
          className="h-48 relative bg-gradient-to-br from-obsidian-100 to-obsidian-200 group cursor-pointer overflow-hidden"
          onClick={() => coverInputRef.current?.click()}
        >
          {formData.coverUrl ? (
            <img src={formData.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-obsidian-300 opacity-50">
              <Camera size={32} className="mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">{isUploadingCover ? 'Subiendo...' : 'Añadir Portada'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Camera size={24} />
          </div>

          <div className="absolute -bottom-12 left-8">
            <div
              className="relative group cursor-pointer"
              onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}
            >
              <div className="w-32 h-32 rounded-[2rem] border-[6px] border-white bg-white shadow-2xl flex items-center justify-center overflow-hidden rotate-3 hover:rotate-0 transition-all duration-500">
                {isUploadingAvatar ? (
                  <div className="w-full h-full bg-obsidian-100 flex items-center justify-center text-obsidian-500 font-bold text-xs uppercase tracking-widest text-center px-2">Subiendo...</div>
                ) : formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-obsidian-400 to-obsidian-600 flex items-center justify-center text-4xl font-serif text-white">
                    {formData.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-xl border border-obsidian-50 text-obsidian-600 scale-90 group-hover:scale-110 transition-transform">
                <Camera size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-10 px-10 space-y-8">
          <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3">
                Identidad Sugerida
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-300 group-focus-within:text-obsidian-600 transition-colors" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-obsidian-50/50 border border-obsidian-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-obsidian-100 focus:border-obsidian-300 outline-none text-gray-900 font-serif text-lg transition-all"
                  placeholder="Tu nombre o apodo espiritual"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3 leading-relaxed">
                Fecha de Nacimiento <br /><span className="text-[8px] opacity-70">(Para cálculo astrológico)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-300" size={18} />
                <input
                  type="date"
                  style={{ colorScheme: 'light' }}
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-obsidian-50/50 border border-obsidian-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-obsidian-100 outline-none text-gray-900 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3">
                Última Menstruación
              </label>
              <div className="relative">
                <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" size={18} />
                <input
                  type="date"
                  style={{ colorScheme: 'light' }}
                  value={formData.lastPeriodDate}
                  onChange={(e) => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-obsidian-50/50 border border-obsidian-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-obsidian-100 outline-none text-gray-900 transition-all font-sans"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3">
                Duración Promedio del Ciclo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="20"
                  max="45"
                  step="1"
                  value={formData.cycleLength}
                  onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) })}
                  className="flex-1 h-3 bg-obsidian-100 rounded-lg appearance-none cursor-pointer accent-obsidian-600"
                />
                <span className="w-16 text-center py-2 bg-obsidian-900 text-white rounded-xl font-bold text-sm">
                  {formData.cycleLength} d
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 font-medium">Desliza para ajustar según tu regularidad habitual.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className={`text-sm font-bold flex items-center transition-all ${isSaved ? 'text-green-600 opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <ShieldCheck size={18} className="mr-2" />
              Sincronización sagrada completada
            </p>
            <button
              type="submit"
              disabled={isUploadingAvatar || isUploadingCover}
              className="w-full md:w-auto flex items-center justify-center space-x-3 bg-obsidian-900 hover:bg-black text-white px-10 py-4 rounded-2xl transition-all shadow-xl hover:shadow-obsidian-300/50 transform hover:-translate-y-1 active:scale-95 group disabled:opacity-50"
            >
              <Save size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                {isUploadingAvatar || isUploadingCover ? 'Subiendo imagen...' : 'Actualizar Energía'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* ─── SECCIÓN CAMBIO DE CONTRASEÑA ─── */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-obsidian-50 overflow-hidden transition-all duration-500 hover:shadow-2xl">
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-obsidian-100 rounded-2xl">
              <KeyRound className="w-6 h-6 text-obsidian-600" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-obsidian-900">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-400 font-medium">Protege tu cuenta con una nueva contraseña segura</p>
            </div>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3">
                Nueva Contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-300" size={18} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Mín. 6 caracteres"
                  className="w-full pl-12 pr-12 py-4 bg-obsidian-50/50 border border-obsidian-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-obsidian-100 focus:border-obsidian-300 outline-none text-gray-900 transition-all font-sans"
                  minLength={6}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-300 hover:text-obsidian-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-obsidian-400 uppercase tracking-[0.2em] mb-3">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-300" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                  className="w-full pl-12 pr-12 py-4 bg-obsidian-50/50 border border-obsidian-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-obsidian-100 focus:border-obsidian-300 outline-none text-gray-900 transition-all font-sans"
                  minLength={6}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-300 hover:text-obsidian-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full md:w-auto flex items-center justify-center space-x-3 bg-obsidian-600 hover:bg-obsidian-700 text-white px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 group disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <KeyRound size={20} className="group-hover:rotate-12 transition-transform" />
                )}
                <span className="text-sm font-bold uppercase tracking-widest">
                  {isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileEdit;
