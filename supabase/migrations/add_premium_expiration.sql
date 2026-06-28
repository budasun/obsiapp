-- ============================================================
-- MIGRACIÓN: Sistema de Expiración Premium
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar columna de fecha de expiración premium
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Agregar columna para guardar el ID de suscripción de Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT NULL;

-- 3. Agregar columna para guardar el ID de cliente de Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT NULL;

-- 4. (Opcional) Para usuarios premium actuales sin fecha de expiración,
--    establecer una fecha de expiración razonable (ej. 30 días desde ahora)
--    DESCOMENTA si quieres aplicar retroactivamente:
-- UPDATE profiles 
-- SET premium_expires_at = NOW() + INTERVAL '30 days'
-- WHERE is_premium = true AND premium_expires_at IS NULL;

-- ============================================================
-- NOTAS:
-- - premium_expires_at = NULL significa que no hay expiración activa
-- - Si is_premium = true AND premium_expires_at < NOW() → expirado
-- - El webhook actualiza premium_expires_at en cada renovación
-- ============================================================
