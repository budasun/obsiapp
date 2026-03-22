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

async function findUserIdByEmail(email: string, productName: string): Promise<string | null> {
  console.log(`🔍 Buscando usuario para activar ${productName} por Email: ${email}`);

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
  console.log(`👑 Activando membresía Premium para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, is_premium: true }, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error activando Premium: ${error.message}`);
    return false;
  }

  console.log(`✅ Usuario ${userId} es ahora Premium`);
  return true;
}

async function activateBook(userId: string) {
  console.log(`📚 Activando acceso al Libro para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, has_book: true }, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error activando Book: ${error.message}`);
    return false;
  }

  console.log(`✅ Usuario ${userId} tiene acceso al Libro`);
  return true;
}

async function getEmailFromLatestInvoice(sessionId: string): Promise<string | null> {
  try {
    console.log(`📨 Obteniendo latest_invoice para session: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["latest_invoice"],
    });

    if (session.latest_invoice && typeof session.latest_invoice !== "string") {
      const invoice = session.latest_invoice;
      console.log(`📨 Invoice ID: ${invoice.id}, customer_email: ${invoice.customer_email}`);
      return invoice.customer_email || null;
    }
  } catch (err) {
    console.error(`❌ Error obteniendo latest_invoice:`, err);
  }
  return null;
}

async function getUserIdForSession(session: Stripe.Checkout.Session, productName: string): Promise<{ userId: string | null; email: string | null }> {
  let userId = session.client_reference_id;
  let email = session.customer_details?.email || null;

  console.log(`📨 Session data - client_reference_id: ${userId}, customer_details.email: ${email}`);

  if (!userId && !email) {
    console.log(`📨 Intentando obtener email desde latest_invoice...`);
    email = await getEmailFromLatestInvoice(session.id);
  }

  if (!userId && email) {
    userId = await findUserIdByEmail(email, productName);
  }

  return { userId, email };
}

async function getUserIdForInvoice(invoice: Stripe.Invoice, productName: string): Promise<{ userId: string | null; email: string | null }> {
  let userId: string | null = null;
  let email: string | null = invoice.customer_email || null;

  console.log(`📨 Invoice data - customer_email: ${email}`);

  if (!email && invoice.subscription) {
    try {
      let subscription: Stripe.Subscription;

      if (typeof invoice.subscription === "string") {
        subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      } else {
        subscription = invoice.subscription;
      }

      userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;
      email = subscription.metadata?.customer_email || null;

      console.log(`📨 Subscription metadata - userId: ${userId}, customer_email: ${email}`);
    } catch (err) {
      console.error(`❌ Error obteniendo subscription:`, err);
    }
  }

  if (!userId && email) {
    userId = await findUserIdByEmail(email, productName);
  }

  return { userId, email };
}

async function getProductIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  if (subscription.items.data[0]?.price?.product) {
    const productRef = subscription.items.data[0].price.product;
    return typeof productRef === "string" ? productRef : productRef.id;
  }
  return null;
}

async function processCheckoutSession(session: Stripe.Checkout.Session) {
  const productId = (session.line_items?.data[0]?.price?.product as string) || null;
  const productName = productId === LIBRO_PRODUCT_ID ? "Libro" : 
                      productId === MENSUAL_PRODUCT_ID ? "Membresía Mensual" : 
                      productId === ANUAL_PRODUCT_ID ? "Membresía Anual" : "Producto";

  console.log(`\n========== CHECKOUT SESSION ==========`);
  console.log(`📨 Session ID: ${session.id}`);
  console.log(`📨 Product ID: ${productId}`);

  if (!productId) {
    console.warn("⚠️ No se encontró productId en line_items");
    return;
  }

  const { userId, email } = await getUserIdForSession(session, productName);

  if (!userId) {
    console.warn(`⚠️ No se pudo identificar al usuario para ${productName}`);
    return;
  }

  if (productId === LIBRO_PRODUCT_ID) {
    await activateBook(userId);
  } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
    await activatePremium(userId);
  }

  console.log(`========== FIN CHECKOUT ==========\n`);
}

async function processInvoicePaid(invoice: Stripe.Invoice) {
  let subscription: Stripe.Subscription | null = null;
  let productId: string | null = null;

  console.log(`\n========== INVOICE PAID ==========`);
  console.log(`📨 Invoice ID: ${invoice.id}`);
  console.log(`📨 Customer Email: ${invoice.customer_email}`);

  if (invoice.subscription) {
    try {
      if (typeof invoice.subscription === "string") {
        subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
          expand: ["items.data.price.product"],
        });
      } else {
        subscription = invoice.subscription;
      }

      productId = await getProductIdFromSubscription(subscription);
      console.log(`📨 Subscription ID: ${subscription.id}`);
      console.log(`📨 Product ID: ${productId}`);
    } catch (err) {
      console.error(`❌ Error obteniendo subscription:`, err);
    }
  }

  const productName = productId === LIBRO_PRODUCT_ID ? "Libro" : 
                      productId === MENSUAL_PRODUCT_ID ? "Membresía Mensual" : 
                      productId === ANUAL_PRODUCT_ID ? "Membresía Anual" : "Producto";

  const { userId, email } = await getUserIdForInvoice(invoice, productName);

  if (!userId) {
    console.warn(`⚠️ No se pudo identificar al usuario para ${productName}`);
    console.log(`========== FIN INVOICE ==========\n`);
    return;
  }

  if (productId === LIBRO_PRODUCT_ID) {
    await activateBook(userId);
  } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
    await activatePremium(userId);
  }

  console.log(`========== FIN INVOICE ==========\n`);
}

async function processSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  const userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;
  const email = subscription.metadata?.customer_email || null;
  const productId = await getProductIdFromSubscription(subscription);

  const productName = productId === LIBRO_PRODUCT_ID ? "Libro" : 
                      productId === MENSUAL_PRODUCT_ID ? "Membresía Mensual" : 
                      productId === ANUAL_PRODUCT_ID ? "Membresía Anual" : "Producto";

  console.log(`\n========== ${eventType.toUpperCase()} ==========`);
  console.log(`📨 Subscription ID: ${subscription.id}`);
  console.log(`📨 Product ID: ${productId}`);
  console.log(`📨 UserId metadata: ${userId}`);
  console.log(`📨 Email metadata: ${email}`);

  let resolvedUserId = userId;

  if (!resolvedUserId && email) {
    resolvedUserId = await findUserIdByEmail(email, productName);
  }

  if (!resolvedUserId) {
    console.warn(`⚠️ No se pudo identificar al usuario para ${productName}`);
    console.log(`========== FIN SUBSCRIPTION ==========\n`);
    return;
  }

  if (productId === LIBRO_PRODUCT_ID) {
    await activateBook(resolvedUserId);
  } else if (productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID) {
    await activatePremium(resolvedUserId);
  }

  console.log(`========== FIN SUBSCRIPTION ==========\n`);
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

    console.log(`\n========================================`);
    console.log(`📨 NUEVO EVENTO: ${event.type}`);
    console.log(`========================================`);

    if (event.type === "checkout.session.completed") {
      await processCheckoutSession(event.data.object as Stripe.Checkout.Session);
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

    console.log(`========================================\n`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`❌ Error en Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
