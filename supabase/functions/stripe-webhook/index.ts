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

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function processPayment(userId: string, productId: string | null, session?: Stripe.Checkout.Session) {
  console.log(`💰 Procesando producto ${productId} para usuario: ${userId}`);

  const updateData: Record<string, unknown> = {};

  if (productId === STRIPE_PRODUCT_IDS.LIBRO) {
    updateData.has_book = true;
    console.log(`📚 Activando Libro para ${userId}`);
  } else if (productId === STRIPE_PRODUCT_IDS.MENSUAL || productId === STRIPE_PRODUCT_IDS.ANUAL) {
    updateData.is_premium = true;
    const plan = productId === STRIPE_PRODUCT_IDS.MENSUAL ? "Membresía Mensual" : "Membresía Anual";
    console.log(`👑 Activando ${plan} para ${userId}`);
  } else if (productId) {
    console.log(`📦 Producto desconocido: ${productId}`);
    return false;
  }

  if (session?.customer_details) {
    updateData.email = session.customer_details.email || null;
    updateData.full_name = session.customer_details.name || null;
  }

  if (Object.keys(updateData).length === 0) {
    console.log(`⚠️ No hay datos para actualizar`);
    return false;
  }

  updateData.id = userId;

  const { error: upsertError } = await supabaseAdmin
    .from("profiles")
    .upsert(updateData, { onConflict: "id" });

  if (upsertError) {
    console.error(`❌ Error en UPSERT: ${upsertError.message}`);
    return false;
  }

  console.log(`✅ Success: Usuario ${userId} recibió producto ${productId}`);
  return true;
}

async function getProductIdFromCheckoutSession(sessionId: string): Promise<string | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });

    if (session.line_items?.data && session.line_items.data.length > 0) {
      const productId = (session.line_items.data[0].price?.product as Stripe.Product)?.id;
      return productId || null;
    }
    return null;
  } catch (err) {
    console.error("Error retrieving session:", err);
    return null;
  }
}

async function getProductIdFromInvoice(invoiceId: string): Promise<string | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["subscription", "subscription.items.data.price.product"],
    });

    if (invoice.subscription && typeof invoice.subscription !== 'string') {
      const subscriptionItems = invoice.subscription.items.data;
      if (subscriptionItems.length > 0) {
        const productId = (subscriptionItems[0].price?.product as Stripe.Product)?.id;
        return productId || null;
      }
    }
    return null;
  } catch (err) {
    console.error("Error retrieving invoice:", err);
    return null;
  }
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

    console.log(`📨 Evento recibido: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (!userId) {
        console.warn("⚠️ checkout.session.completed sin client_reference_id");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      let productId: string | null = null;

      if (session.line_items?.data && session.line_items.data.length > 0) {
        productId = (session.line_items.data[0].price?.product as Stripe.Product)?.id || null;
      } else {
        productId = await getProductIdFromCheckoutSession(session.id);
      }

      if (productId) {
        await processPayment(userId, productId, session);
      } else {
        console.warn(`⚠️ No se pudo determinar el producto para session ${session.id}`);
      }
    }

    else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log(`🧾 Invoice pagada: ${invoice.id}, subscription: ${invoice.subscription}`);

      if (invoice.subscription && typeof invoice.subscription === 'string') {
        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price.product"],
          });

          const metadata = subscription.metadata;
          const userId = metadata.client_reference_id || metadata.user_id;

          if (userId && subscription.items.data.length > 0) {
            const productId = (subscription.items.data[0].price?.product as Stripe.Product)?.id;
            if (productId) {
              await processPayment(userId, productId);
            }
          }
        } catch (err) {
          console.error("Error procesando invoice.paid:", err);
        }
      }
    }

    else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.client_reference_id || subscription.metadata.user_id;

      if (userId && subscription.items.data.length > 0) {
        const productId = (subscription.items.data[0].price?.product as Stripe.Product)?.id;
        if (productId) {
          await processPayment(userId, productId);
        }
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
