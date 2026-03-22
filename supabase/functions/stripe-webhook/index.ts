import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const LIBRO_PAYMENT_LINK_ID = "plink_1TCAKj0nE7s4s8Me6BavX8K1";
const PREMIUM_PAYMENT_LINK_ID = "plink_1TCAJr0nE7s4s8Meuomfa6go";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function findUserIdByEmail(email: string): Promise<string | null> {
  console.log(`🔍 Buscando usuario por email: ${email}`);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) {
    console.log(`⚠️ No se encontró usuario con email: ${email}`);
    return null;
  }

  console.log(`✅ Usuario encontrado por email: ${data.id}`);
  return data.id;
}

async function activatePremium(userId: string) {
  console.log(`👑 Activando is_premium=true para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, is_premium: true }, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error en upsert Premium: ${error.message}`);
    return false;
  }

  console.log(`✅ Premium activado para ${userId}`);
  return true;
}

async function activateBook(userId: string) {
  console.log(`📚 Activando has_book=true para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, has_book: true }, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error en upsert Book: ${error.message}`);
    return false;
  }

  console.log(`✅ Book activado para ${userId}`);
  return true;
}

async function processEvent(event: Stripe.Event) {
  console.log(`\n========================================`);
  console.log(`📨 NUEVO EVENTO: ${event.type}`);
  console.log(`========================================`);

  let userId: string | null = null;
  let paymentLinkId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log(`📨 Session ID: ${session.id}`);
    console.log(`📨 Payment Link: ${session.payment_link}`);
    console.log(`📨 Client Reference ID: ${session.client_reference_id}`);
    console.log(`📨 Customer Email: ${session.customer_details?.email}`);

    paymentLinkId = session.payment_link || null;
    userId = session.client_reference_id || null;

    if (!userId && session.customer_details?.email) {
      userId = await findUserIdByEmail(session.customer_details.email);
    }

    if (!userId) {
      console.log(`🔍 Intentando con email fijo: luzdegaspsico@gmail.com`);
      userId = await findUserIdByEmail("luzdegaspsico@gmail.com");
    }

    if (!userId) {
      console.warn(`❌ NO SE PUDO IDENTIFICAR AL USUARIO`);
      console.log(`========================================\n`);
      return;
    }

    console.log(`✅ Usuario identificado: ${userId}`);

    if (paymentLinkId === LIBRO_PAYMENT_LINK_ID) {
      console.log(`🔍 Payment Link detectado: LIBRO`);
      await activateBook(userId);
    } else if (paymentLinkId === PREMIUM_PAYMENT_LINK_ID) {
      console.log(`🔍 Payment Link detectado: PREMIUM`);
      await activatePremium(userId);
    } else {
      console.log(`⚠️ Payment Link no reconocido: ${paymentLinkId}`);
    }
  }

  console.log(`========================================\n`);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );

    await processEvent(event);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`❌ Error en Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
