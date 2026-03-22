import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const LIBRO_PRODUCT_ID = "prod_UAUdLWq6RAMf5F";
const MENSUAL_PRODUCT_ID = "prod_UAUmlnCoj6k871";
const ANUAL_PRODUCT_ID = "prod_UAUo8C4iYIaPv9";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function findUserIdByEmail(email: string): Promise<string | null> {
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

async function processCheckoutSession(sessionId: string) {
  console.log(`\n========================================`);
  console.log(`📨 CHECKOUT.SESSION.COMPLETED`);
  console.log(`========================================`);
  console.log(`📨 Session ID: ${sessionId}`);

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const clientRefId = session.client_reference_id;
  const email = session.customer_details?.email || null;

  console.log(`🔍 client_reference_id: ${clientRefId}`);
  console.log(`🔍 customer_details.email: ${email}`);

  let userId = clientRefId;
  let resolvedEmail = email;

  if (!userId && email) {
    console.log(`🔍 Buscando usuario por email: ${email}`);
    userId = await findUserIdByEmail(email);
    resolvedEmail = email;
  }

  if (!userId) {
    console.warn(`❌ NO SE PUDO IDENTIFICAR AL USUARIO`);
    console.log(`========================================\n`);
    return;
  }

  console.log(`✅ Usuario identificado: ${userId}`);

  const lineItems = session.line_items?.data || [];
  
  if (lineItems.length === 0) {
    console.warn(`⚠️ No se encontraron line_items`);
    console.log(`========================================\n`);
    return;
  }

  for (const item of lineItems) {
    let productId: string | null = null;
    let productName = "Unknown";

    if (item.price?.product) {
      if (typeof item.price.product === "string") {
        productId = item.price.product;
      } else {
        productId = item.price.product.id;
        productName = item.price.product.name || productId;
      }
    }

    if (!productId) {
      console.warn(`⚠️ No se pudo obtener productId del item`);
      continue;
    }

    console.log(`🔍 DETECTADO: Usuario ${resolvedEmail} compró producto ${productId} (${productName})`);

    if (productId === LIBRO_PRODUCT_ID) {
      await activateBook(userId);
    } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
      await activatePremium(userId);
    } else {
      console.log(`📦 Producto no reconocido: ${productId}`);
    }
  }

  console.log(`========================================\n`);
}

async function processInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`\n========================================`);
  console.log(`📨 INVOICE.PAID`);
  console.log(`========================================`);
  console.log(`📨 Invoice ID: ${invoice.id}`);
  console.log(`📨 Customer Email: ${invoice.customer_email}`);

  let userId: string | null = null;
  let email: string | null = invoice.customer_email || null;

  if (!email && invoice.subscription) {
    try {
      const subscription = typeof invoice.subscription === "string"
        ? await stripe.subscriptions.retrieve(invoice.subscription)
        : invoice.subscription;

      userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;
      email = subscription.metadata?.customer_email || null;

      console.log(`🔍 Subscription metadata - userId: ${userId}, email: ${email}`);
    } catch (err) {
      console.error(`❌ Error obteniendo subscription:`, err);
    }
  }

  if (!userId && email) {
    userId = await findUserIdByEmail(email);
  }

  if (!userId) {
    console.warn(`❌ NO SE PUDO IDENTIFICAR AL USUARIO`);
    console.log(`========================================\n`);
    return;
  }

  console.log(`✅ Usuario identificado: ${userId}`);

  let productId: string | null = null;

  if (invoice.subscription) {
    try {
      const subscription = typeof invoice.subscription === "string"
        ? await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price.product"],
          })
        : invoice.subscription;

      const item = subscription.items.data[0];
      if (item?.price?.product) {
        productId = typeof item.price.product === "string"
          ? item.price.product
          : item.price.product.id;
      }
    } catch (err) {
      console.error(`❌ Error obteniendo subscription:`, err);
    }
  }

  if (productId) {
    console.log(`🔍 DETECTADO: Usuario ${email} compró producto ${productId}`);

    if (productId === LIBRO_PRODUCT_ID) {
      await activateBook(userId);
    } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
      await activatePremium(userId);
    }
  }

  console.log(`========================================\n`);
}

async function processSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  console.log(`\n========================================`);
  console.log(`📨 ${eventType.toUpperCase()}`);
  console.log(`========================================`);
  console.log(`📨 Subscription ID: ${subscription.id}`);

  const userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;
  const email = subscription.metadata?.customer_email || null;

  console.log(`🔍 Metadata userId: ${userId}`);
  console.log(`🔍 Metadata email: ${email}`);

  let resolvedUserId = userId;

  if (!resolvedUserId && email) {
    resolvedUserId = await findUserIdByEmail(email);
  }

  if (!resolvedUserId) {
    console.warn(`❌ NO SE PUDO IDENTIFICAR AL USUARIO`);
    console.log(`========================================\n`);
    return;
  }

  console.log(`✅ Usuario identificado: ${resolvedUserId}`);

  const item = subscription.items.data[0];
  if (item?.price?.product) {
    const productId = typeof item.price.product === "string"
      ? item.price.product
      : item.price.product.id;

    console.log(`🔍 DETECTADO: Usuario ${email} compró producto ${productId}`);

    if (productId === LIBRO_PRODUCT_ID) {
      await activateBook(resolvedUserId);
    } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
      await activatePremium(resolvedUserId);
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

    console.log(`\n########################################`);
    console.log(`📨 NUEVO EVENTO: ${event.type}`);
    console.log(`########################################`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await processCheckoutSession(session.id);
    }

    else if (event.type === "invoice.paid") {
      await processInvoicePaid(event.data.object as Stripe.Invoice);
    }

    else if (event.type === "customer.subscription.created") {
      await processSubscriptionEvent(
        event.data.object as Stripe.Subscription,
        "customer.subscription.created"
      );
    }

    else if (event.type === "customer.subscription.updated") {
      await processSubscriptionEvent(
        event.data.object as Stripe.Subscription,
        "customer.subscription.updated"
      );
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
