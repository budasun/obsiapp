import React, { useState } from 'react';
import { Lock, Sparkles, Check, Crown, BookOpen, Heart, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Plan = 'libro' | 'alquimista' | 'donacion';

const PremiumUnlock: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { session } = useApp();

  const handleStripeCheckout = (plan: Plan) => {
    setIsLoading(true);
    setSelectedPlan(plan);
    
    const links: Record<Plan, string> = {
      libro: 'https://buy.stripe.com/8x27sD51McVDawo26w7kc02',
      alquimista: 'https://buy.stripe.com/test_5kQ28j69k2EdaJW0pA9EI01',
      donacion: 'https://donate.stripe.com/dRm28j0Lw08R4806mM7kc04'
    };

    const checkoutUrl = session?.user ? `${links[plan]}?client_reference_id=${session.user.id}` : links[plan];
    window.location.href = checkoutUrl;
  };

  return (
    <div className="fixed inset-0 bg-[#F5F5F0] flex items-center justify-center p-6 z-[100] animate-fade-in overflow-auto">
      <div className="max-w-5xl w-full text-center space-y-10 py-8">
        
        <div className="space-y-4">
          <div className="relative group inline-block">
            <div className="absolute inset-0 bg-obsidian-400 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="/portada.jpg" 
              alt="Portada" 
              className="relative w-40 h-auto mx-auto rounded-lg shadow-2xl rotate-1 group-hover:rotate-0 transition-transform duration-700" 
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-obsidian-900 italic">
            Desbloquea tu Camino
          </h1>
          <p className="text-obsidian-600 font-serif leading-relaxed text-lg max-w-xl mx-auto">
            El mapa sagrado de tu inconsciente te espera. Elige tu nivel de acceso y comienza tu transformación.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Plan: Acceso al Libro */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-obsidian-100 hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                PAGO ÚNICO
              </div>
              
              <div className="mb-6 mt-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="text-[#D4AF37]" size={24} />
                  <h2 className="text-2xl font-serif font-bold text-obsidian-900">Acceso al Libro</h2>
                </div>
                <p className="text-obsidian-500 text-sm">La guía completa de arquetipos</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-obsidian-900">🇺🇸$49.99</span>
              </div>

              <ul className="text-left space-y-3 mb-8 flex-1">
                {[
                  'Acceso completo al "Despertar de Osiris"',
                  'Todas las páginas y contenidos',
                  'Marcadores y notas personales',
                  'Lectura sin conexión',
                  'Actualizaciones futuras incluidas'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-obsidian-600">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStripeCheckout('libro')}
                disabled={isLoading}
                className="w-full py-4 bg-obsidian-800 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isLoading && selectedPlan === 'libro' ? (
                  <span className="animate-pulse">Redirigiendo...</span>
                ) : (
                  <>
                    <Lock size={18} /> Desbloquear Libro
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plan: Membresía Premium - DESTACADA */}
          <div className="relative group lg:scale-105 lg:z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/40 to-transparent rounded-3xl blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-gradient-to-br from-obsidian-900 to-obsidian-800 rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-[#D4AF37]/40 hover:-translate-y-2 transition-transform duration-300 flex flex-col text-white h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-obsidian-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <Crown size={14} /> MÁS POPULAR
              </div>
              
              <div className="mb-6 mt-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="text-[#D4AF37]" size={24} />
                  <h2 className="text-2xl font-serif font-bold">Membresía Premium</h2>
                </div>
                <p className="text-obsidian-300 text-sm">Acceso total a todo el ecosistema</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">🇺🇸$19.99</span>
                <span className="text-obsidian-300 ml-2">/mes</span>
              </div>

              <ul className="text-left space-y-3 mb-8 flex-1">
                {[
                  'Todo lo del plan Libro',
                  'Acceso al Chatbot Arcano con IA',
                  'Comunidad privada de sueños',
                  'Biblioteca expandida de rituales',
                  'Sesiones mensuales en vivo',
                  'Soporte prioritario'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-obsidian-100">
                    <Check className="text-[#D4AF37] flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStripeCheckout('alquimista')}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-obsidian-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isLoading && selectedPlan === 'alquimista' ? (
                  <span className="animate-pulse">Redirigiendo...</span>
                ) : (
                  <>
                    <Sparkles size={18} /> Obtener Membresía
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plan: La Ofrenda - DONACIÓN */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-100/60 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-amber-200 hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <Flame size={14} /> VOLUNTARIO
              </div>
              
              <div className="mb-6 mt-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-serif font-bold text-obsidian-900">La Ofrenda</h2>
                </div>
                <p className="text-obsidian-500 text-sm">de la Guardiana</p>
              </div>

              <div className="mb-6">
                <span className="text-2xl font-bold text-obsidian-900">Aporte Libre</span>
              </div>

              <p className="text-left text-obsidian-600 text-sm mb-6 flex-1 leading-relaxed">
                Obsidiana está construida con profundo respeto por la sanación del linaje. 
                Si este refugio te ha brindado claridad, tu aportación voluntaria permite que 
                los servidores sigan vivos, que la IA mejore y que la sanación llegue a más mujeres.
              </p>

              <button
                onClick={() => handleStripeCheckout('donacion')}
                disabled={isLoading}
                className="w-full py-4 bg-transparent border-2 border-amber-400 text-amber-700 rounded-2xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isLoading && selectedPlan === 'donacion' ? (
                  <span className="animate-pulse">Redirigiendo...</span>
                ) : (
                  <>
                    <Heart size={18} /> Hacer una Ofrenda
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        <p className="text-obsidian-400 text-sm">
          Pago seguro con Stripe. Cancela tu membresía cuando quieras.
        </p>

      </div>
    </div>
  );
};

export default PremiumUnlock;
