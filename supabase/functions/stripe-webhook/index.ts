import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const STRIPE_PRODUCT_IDS = {
  LIBRO: "prod_UAUdLWq6RAMf5F",
  MENSUAL: "prod_UAUmlnCoj6k871",
  ANUAL: "prod_UAUo8C4iYIaPv9",
} as const;

type ProductType = keyof typeof STRIPE_PRODUCT_IDS;

// ============================================================
// HELPER: Crear cliente Supabase Admin
// ============================================================
const getSupabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

// ============================================================
// HELPER: Buscar userId por email en profiles
// ============================================================
const findUserIdByEmail = async (email: string): Promise<string | null> => {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();
  return data?.id || null;
};

// ============================================================
// HELPER: Buscar userId por Stripe customer ID
// ============================================================
const findUserIdByStripeCustomer = async (customerId: string): Promise<string | null> => {
  // Primero buscar por stripe_customer_id
  const supabase = getSupabaseAdmin();
  const { data: byCustomerId } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  
  if (byCustomerId?.id) return byCustomerId.id;

  // Fallback: buscar por email del customer en Stripe
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (customer.email) {
      return await findUserIdByEmail(customer.email);
    }
  } catch (err) {
    console.error(`❌ Error obteniendo customer de Stripe:`, err);
  }

  return null;
};

// ============================================================
// HELPER: Verificar si un producto es una suscripción PRO
// ============================================================
const isProSubscription = (productId: string): boolean => {
  return productId === STRIPE_PRODUCT_IDS.MENSUAL || productId === STRIPE_PRODUCT_IDS.ANUAL;
};

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

    console.log(`\n📨 Evento recibido: ${event.type}`);

    // ============================================================
    // EVENTO 1: checkout.session.completed
    // Se dispara cuando el usuario completa el pago por primera vez
    // ============================================================
    if (event.type === "checkout.session.completed") {
      const session = await stripe.checkout.sessions.retrieve(
        (event.data.object as Stripe.Checkout.Session).id,
        {
          expand: ["line_items", "line_items.data.price.product", "subscription"],
        }
      );

      let userId = session.client_reference_id;

      if (!userId && session.customer_details?.email) {
        console.log("🔍 ID no encontrado, buscando usuario por email...");
        userId = await findUserIdByEmail(session.customer_details.email);
      }

      if (!userId) {
        console.warn("⚠️ checkout.session.completed sin client_reference_id ni email válido");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`💰 Procesando pago para usuario: ${userId}`);

      const updateData: Record<string, unknown> = {
        email: session.customer_details?.email || null,
        full_name: session.customer_details?.name || null,
      };

      // Guardar Stripe Customer ID para futuras búsquedas
      if (session.customer && typeof session.customer === "string") {
        updateData.stripe_customer_id = session.customer;
      }

      let productsActivated: string[] = [];

      if (session.line_items?.data) {
        for (const item of session.line_items.data) {
          const productId = (item.price?.product as Stripe.Product)?.id;

          if (productId) {
            if (productId === STRIPE_PRODUCT_IDS.LIBRO) {
              updateData.has_book = true;
              productsActivated.push("Libro (Huevo de Obsidiana)");
            } else if (isProSubscription(productId)) {
              updateData.is_premium = true;

              // Calcular fecha de expiración basada en el tipo de plan
              const isAnual = productId === STRIPE_PRODUCT_IDS.ANUAL;
              const daysToAdd = isAnual ? 365 : 30;
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysToAdd);
              updateData.premium_expires_at = expiresAt.toISOString();

              // Guardar subscription ID si existe
              if (session.subscription) {
                const subId = typeof session.subscription === "string" 
                  ? session.subscription 
                  : session.subscription.id;
                updateData.stripe_subscription_id = subId;
              }

              const plan = isAnual ? "Membresía Anual" : "Membresía Mensual";
              productsActivated.push(plan);
            } else {
              console.log(`📦 Producto desconocido: ${productId}`);
            }
          }
        }
      }

      if (!updateData.is_premium && session.metadata?.product_type === "premium") {
        console.log("🔍 Respaldo: Activando Membresía por Metadata");
        updateData.is_premium = true;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        updateData.premium_expires_at = expiresAt.toISOString();
        productsActivated.push("Membresía (Metadata)");
      }

      if (productsActivated.length === 0) {
        console.log(`⚠️ No se reconocieron productos en la compra`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            ...updateData,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error(`❌ Error en UPSERT: ${upsertError.message}`);
        return new Response(`Error: ${upsertError.message}`, {
          status: 500,
        });
      }

      console.log(
        `✅ Success: Usuario ${userId} recibió: ${productsActivated.join(", ")}`
      );
      if (updateData.premium_expires_at) {
        console.log(`📅 Premium expira: ${updateData.premium_expires_at}`);
      }
    }

    // ============================================================
    // EVENTO 2: customer.subscription.created
    // Se dispara cuando se crea una nueva suscripción
    // ============================================================
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`\n📨 CUSTOMER.SUBSCRIPTION.CREATED`);
      console.log(`📨 Subscription ID: ${subscription.id}`);
      console.log(`📨 Status: ${subscription.status}`);

      const customerId = typeof subscription.customer === "string" 
        ? subscription.customer 
        : null;
      
      if (!customerId) {
        console.warn("⚠️ subscription.created sin customer ID");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserIdByStripeCustomer(customerId);

      if (!userId) {
        console.warn(`⚠️ No se pudo identificar al usuario para la suscripción`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const subWithProduct = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ["items.data.price.product"],
      });

      const productId = (subWithProduct.items.data[0]?.price?.product as Stripe.Product)?.id;

      console.log(`🔍 Product ID: ${productId}`);

      if (productId && isProSubscription(productId)) {
        console.log(`👑 Activando is_premium=true para usuario: ${userId}`);

        const isAnual = productId === STRIPE_PRODUCT_IDS.ANUAL;
        const daysToAdd = isAnual ? 365 : 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);

        const supabaseAdmin = getSupabaseAdmin();
        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
          }, { onConflict: "id" });

        if (upsertError) {
          console.error(`❌ Error en UPSERT: ${upsertError.message}`);
        } else {
          console.log(`✅ Success: Usuario ${userId} recibió Membresía Premium (expira: ${expiresAt.toISOString()})`);
        }
      }
    }

    // ============================================================
    // EVENTO 3: customer.subscription.updated
    // Se dispara cuando cambia el estado de la suscripción
    // (cancelación programada, fallo de pago, etc.)
    // ============================================================
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status;

      console.log(`\n📨 CUSTOMER.SUBSCRIPTION.UPDATED`);
      console.log(`📨 Subscription ID: ${subscription.id}`);
      console.log(`📨 Status: ${status}`);
      console.log(`📨 Cancel at period end: ${subscription.cancel_at_period_end}`);

      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : null;

      if (!customerId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserIdByStripeCustomer(customerId);

      if (!userId) {
        console.warn(`⚠️ No se encontró usuario para subscription.updated`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Si la suscripción está marcada para cancelar al final del período,
      // establecer la fecha de expiración al final del período actual
      if (subscription.cancel_at_period_end && subscription.current_period_end) {
        const expiresAt = new Date(subscription.current_period_end * 1000);
        console.log(`⏳ Suscripción se cancelará al final del período: ${expiresAt.toISOString()}`);

        await supabaseAdmin
          .from("profiles")
          .update({
            premium_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);
      }

      // Si la suscripción está en estado impago o cancelada → revocar premium
      if (status === "past_due" || status === "unpaid" || status === "canceled") {
        console.log(`🚫 Revocando premium para usuario: ${userId} (status: ${status})`);

        await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: false,
            premium_expires_at: null,
            stripe_subscription_id: null,
          })
          .eq("id", userId);

        console.log(`✅ Premium revocado para usuario: ${userId}`);
      }
    }

    // ============================================================
    // EVENTO 4: customer.subscription.deleted
    // Se dispara cuando la suscripción se elimina definitivamente
    // (después de cancelar y que termine el período)
    // ============================================================
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`\n📨 CUSTOMER.SUBSCRIPTION.DELETED`);
      console.log(`📨 Subscription ID: ${subscription.id}`);

      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : null;

      if (!customerId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserIdByStripeCustomer(customerId);

      if (!userId) {
        // Fallback: buscar por subscription_id directamente
        const supabaseAdmin = getSupabaseAdmin();
        const { data: bySubId } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        
        if (!bySubId?.id) {
          console.warn(`⚠️ No se encontró usuario para subscription.deleted`);
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Revocar usando el ID encontrado por subscription_id
        await getSupabaseAdmin()
          .from("profiles")
          .update({
            is_premium: false,
            premium_expires_at: null,
            stripe_subscription_id: null,
          })
          .eq("id", bySubId.id);

        console.log(`✅ Premium revocado (por sub_id) para usuario: ${bySubId.id}`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`🚫 Eliminando premium definitivamente para usuario: ${userId}`);

      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: false,
          premium_expires_at: null,
          stripe_subscription_id: null,
        })
        .eq("id", userId);

      console.log(`✅ Premium eliminado para usuario: ${userId}`);
    }

    // ============================================================
    // EVENTO 5: invoice.payment_succeeded
    // Se dispara cuando se cobra exitosamente una renovación
    // ============================================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Solo procesar facturas de suscripción (no la primera)
      if (invoice.billing_reason !== "subscription_cycle") {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`\n📨 INVOICE.PAYMENT_SUCCEEDED (renovación)`);

      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription)?.id;

      if (!subscriptionId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener la suscripción para saber el período
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price.product"],
      });

      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : null;

      if (!customerId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserIdByStripeCustomer(customerId);

      if (!userId) {
        console.warn(`⚠️ No se encontró usuario para invoice.payment_succeeded`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Actualizar la fecha de expiración al final del nuevo período
      const newExpiresAt = new Date(subscription.current_period_end * 1000);
      
      console.log(`🔄 Renovando premium para usuario: ${userId}`);
      console.log(`📅 Nueva expiración: ${newExpiresAt.toISOString()}`);

      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", userId);

      console.log(`✅ Premium renovado para usuario: ${userId}`);
    }

    // ============================================================
    // EVENTO 6: invoice.payment_failed
    // Se dispara cuando falla el cobro de una renovación
    // ============================================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log(`\n📨 INVOICE.PAYMENT_FAILED`);

      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : null;

      if (!customerId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserIdByStripeCustomer(customerId);

      if (userId) {
        console.log(`⚠️ Fallo de pago para usuario: ${userId}. Premium se mantendrá hasta que Stripe cancele la suscripción.`);
        // Nota: No revocamos inmediatamente. Stripe reintenta el cobro varias veces.
        // Si todos los reintentos fallan, Stripe enviará subscription.deleted/updated
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`❌ Error en Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
