import React, { useState } from 'react';
import { Sparkles, Check, Crown, Heart, Flame, ArrowLeft } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';

type Plan = 'pro_mensual' | 'pro_anual' | 'donacion';

const ProUpgrade: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleStripeCheckout = async (plan: Plan) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      alert('Debes iniciar sesión antes de comprar');
      return;
    }

    const userId = authUser.id;
    const userEmail = authUser.email;

    setIsLoading(true);
    setSelectedPlan(plan);
    
    const links: Record<Plan, string> = {
      pro_mensual: 'https://buy.stripe.com/cNi5kv9i22gZeME3aA7kc01',
      pro_anual: 'https://buy.stripe.com/dRm00bdyi5tb33WcLa7kc00',
      donacion: 'https://donate.stripe.com/dRm28j0Lw08R4806mM7kc04'
    };

    const checkoutUrl = `${links[plan]}?client_reference_id=${userId}&customer_email=${userEmail}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="fixed inset-0 bg-[#F5F5F0] flex items-start justify-center p-6 pt-24 z-[100] animate-fade-in overflow-auto">
      <div className="max-w-5xl w-full text-center space-y-10 py-8">
        
        {onClose && (
          <button
            onClick={onClose}
            className="fixed top-6 left-6 z-[110] flex items-center gap-2 text-obsidian-600 hover:text-obsidian-900 transition-colors bg-[#F5F5F0]/80 backdrop-blur-sm p-2 rounded-lg"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Volver</span>
          </button>
        )}

        <div className="space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-amber-400/30 blur-3xl" />
            <Sparkles className="relative text-amber-600" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-obsidian-900 italic">
            Eleva tu Energía
          </h1>
          <p className="text-obsidian-600 font-serif leading-relaxed text-lg max-w-xl mx-auto">
            Elige tu nivel de acompañamiento en el camino de la sanación del linaje femenino.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Plan: El Despertar Mensual */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-obsidian-100 hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="text-[#D4AF37]" size={24} />
                  <h2 className="text-2xl font-serif font-bold text-obsidian-900">El Despertar Mensual</h2>
                </div>
                <p className="text-obsidian-500 text-sm">Acompañamiento continuo ciclo a ciclo.</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-obsidian-900"><span className="text-2xl">🇺🇸</span>$9.99</span>
                <span className="text-obsidian-500 ml-2">/mes</span>
              </div>

              <ul className="text-left space-y-3 mb-8 flex-1">
                {[
                  'Acceso ilimitado a Osiris IA',
                  'Diario en la nube',
                  'Comunidad privada'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-obsidian-600">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStripeCheckout('pro_mensual')}
                disabled={isLoading}
                className="w-full py-4 bg-obsidian-800 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isLoading && selectedPlan === 'pro_mensual' ? (
                  <span className="animate-pulse">Redirigiendo...</span>
                ) : (
                  'Iniciar Suscripción'
                )}
              </button>
            </div>
          </div>

          {/* Plan: El Ciclo Completo - Anual (DESTACADO) */}
          <div className="relative group lg:scale-105 lg:z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/40 to-transparent rounded-3xl blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-gradient-to-br from-obsidian-900 to-obsidian-800 rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-[#D4AF37]/40 hover:-translate-y-2 transition-transform duration-300 flex flex-col text-white h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-obsidian-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <Crown size={14} /> MEJOR VALOR
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 mt-12 bg-red-500 text-white px-3 py-0.5 rounded-full text-xs font-bold z-10">
                2 MESES DE REGALO
              </div>
              
              <div className="mb-6 mt-16">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="text-[#D4AF37]" size={24} />
                  <h2 className="text-2xl font-serif font-bold">El Ciclo Completo</h2>
                </div>
                <p className="text-obsidian-300 text-sm">Sumérgete en tu sanación durante todas las lunas del año con un compromiso profundo.</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold"><span className="text-2xl">🇺🇸</span>$99.00</span>
                <span className="text-obsidian-300 ml-2">/año</span>
              </div>

              <ul className="text-left space-y-3 mb-8 flex-1">
                {[
                  'Todo lo del plan mensual',
                  'Acceso anticipado a nuevas funciones'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-obsidian-100">
                    <Check className="text-[#D4AF37] flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleStripeCheckout('pro_anual')}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-obsidian-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isLoading && selectedPlan === 'pro_anual' ? (
                  <span className="animate-pulse">Redirigiendo...</span>
                ) : (
                  <>
                    <Sparkles size={18} /> Consagrar mi Año
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
          Pago seguro con Stripe. Cancela tu suscripción cuando quieras.
        </p>

      </div>
    </div>
  );
};

export default ProUpgrade;
