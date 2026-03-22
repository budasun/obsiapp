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
    .eq("email", email)
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

function isLibroProduct(productId: string): boolean {
  return productId === LIBRO_PRODUCT_ID;
}

function isMembresiaProduct(productId: string): boolean {
  return productId === MENSUAL_PRODUCT_ID || productId === ANUAL_PRODUCT_ID;
}

function getProductName(productId: string): string {
  if (productId === LIBRO_PRODUCT_ID) return "Libro";
  if (productId === MENSUAL_PRODUCT_ID) return "Membresía Mensual";
  if (productId === ANUAL_PRODUCT_ID) return "Membresía Anual";
  return "Producto Desconocido";
}

async function processPayment(userId: string | null, email: string | null, productId: string) {
  if (!userId && email) {
    userId = await findUserIdByEmail(email);
  }

  if (!userId) {
    console.warn(`⚠️ No se pudo identificar al usuario para producto: ${productId}`);
    return;
  }

  if (isLibroProduct(productId)) {
    await activateBook(userId);
  } else if (isMembresiaProduct(productId)) {
    await activatePremium(userId);
  }
}

async function processCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const email = session.customer_details?.email;
  const productId = (session.line_items?.data[0]?.price?.product as string) || null;

  console.log(`📨 checkout.session.completed - userId: ${userId}, email: ${email}, productId: ${productId}`);

  if (!productId) {
    console.warn("⚠️ No se encontró productId en line_items");
    return;
  }

  await processPayment(userId, email, productId);
}

async function processInvoicePaid(invoice: Stripe.Invoice) {
  let userId: string | null = null;
  let email: string | null = invoice.customer_email || null;
  let productId: string | null = null;

  console.log(`📨 invoice.paid - customer_email: ${email}`);

  if (invoice.subscription) {
    let subscription: Stripe.Subscription;

    if (typeof invoice.subscription === "string") {
      subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ["items.data.price.product"],
      });
    } else {
      subscription = invoice.subscription;
    }

    userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;

    if (!userId && subscription.metadata?.customer_email) {
      email = subscription.metadata.customer_email;
    }

    if (subscription.items.data[0]?.price?.product) {
      productId = typeof subscription.items.data[0].price.product === "string"
        ? subscription.items.data[0].price.product
        : subscription.items.data[0].price.product.id;
    }
  }

  console.log(`📨 invoice.paid - resolved userId: ${userId}, email: ${email}, productId: ${productId}`);

  if (!userId && email) {
    console.log(`🔍 Buscando usuario para activar ${getProductName(productId || "")} por Email: ${email}`);
  }

  await processPayment(userId, email, productId || "");
}

async function processSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  const userId = subscription.metadata?.client_reference_id || subscription.metadata?.user_id || null;
  const email = subscription.metadata?.customer_email || null;

  let productId: string | null = null;
  if (subscription.items.data[0]?.price?.product) {
    productId = typeof subscription.items.data[0].price.product === "string"
      ? subscription.items.data[0].price.product
      : subscription.items.data[0].price.product.id;
  }

  console.log(`📨 ${eventType} - userId: ${userId}, email: ${email}, productId: ${productId}`);

  if (!userId && email) {
    console.log(`🔍 Buscando usuario para activar ${getProductName(productId || "")} por Email: ${email}`);
  }

  await processPayment(userId, email, productId || "");
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

    console.log(`\n========== NUEVO EVENTO ==========`);
    console.log(`📨 Tipo: ${event.type}`);

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

    console.log(`========== FIN EVENTO ==========\n`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`❌ Error en Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
