import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const LIBRO_PRODUCT_ID = "prod_UAUdLWq6RAMf5F";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function activatePremium(userId: string) {
  console.log(`👑 Activando membresía Premium para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: userId, is_premium: true },
      { onConflict: "id" }
    );

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
    .upsert(
      { id: userId, has_book: true },
      { onConflict: "id" }
    );

  if (error) {
    console.error(`❌ Error activando Book: ${error.message}`);
    return false;
  }

  console.log(`✅ Usuario ${userId} tiene acceso al Libro`);
  return true;
}

async function getProductWithMetadata(productId: string): Promise<Stripe.Product | null> {
  try {
    const product = await stripe.products.retrieve(productId);
    console.log(`🔍 Producto recuperado: ${productId}`);
    console.log(`🔍 Metadata del producto: ${JSON.stringify(product.metadata)}`);
    return product;
  } catch (err) {
    console.error(`❌ Error retrieving product ${productId}:`, err);
    return null;
  }
}

function extractUserId(session: Stripe.Checkout.Session): string | null {
  return session.client_reference_id || null;
}

function extractUserIdFromSubscription(subscription: Stripe.Subscription): string | null {
  return (
    subscription.metadata?.client_reference_id ||
    subscription.metadata?.user_id ||
    subscription.metadata?.customer_id ||
    null
  );
}

async function extractUserIdFromInvoice(invoice: Stripe.Invoice): Promise<string | null> {
  if (invoice.metadata?.client_reference_id) {
    return invoice.metadata.client_reference_id;
  }

  if (invoice.subscription && typeof invoice.subscription === "string") {
    try {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      return extractUserIdFromSubscription(subscription);
    } catch {
      return null;
    }
  }

  return null;
}

async function processProduct(userId: string, product: Stripe.Product) {
  console.log(`🔍 Metadata detectada para [${userId}]: product_type = ${product.metadata?.product_type}`);

  if (product.id === LIBRO_PRODUCT_ID) {
    await activateBook(userId);
  } else if (product.metadata?.product_type === "premium") {
    await activatePremium(userId);
  } else {
    console.log(`📦 Producto no reconocido: ${product.id} (type: ${product.metadata?.product_type})`);
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
      const userId = extractUserId(session);

      if (!userId) {
        console.warn("⚠️ checkout.session.completed sin client_reference_id");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`💰 Procesando checkout.session para userId: ${userId}`);

      if (session.line_items?.data) {
        for (const item of session.line_items.data) {
          let productId: string | null = null;

          if (item.price?.product) {
            productId = typeof item.price.product === "string"
              ? item.price.product
              : item.price.product.id;
          }

          if (productId) {
            const product = await getProductWithMetadata(productId);
            if (product) {
              await processProduct(userId, product);
            }
          }
        }
      }
    }

    else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await extractUserIdFromInvoice(invoice);

      if (!userId) {
        console.warn("⚠️ invoice.paid sin userId detectable");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`💰 Procesando invoice.paid para userId: ${userId}`);

      if (invoice.subscription) {
        let subscription: Stripe.Subscription;

        if (typeof invoice.subscription === "string") {
          subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price.product"],
          });
        } else {
          subscription = invoice.subscription;
        }

        for (const item of subscription.items.data) {
          let productId: string | null = null;

          if (item.price?.product) {
            productId = typeof item.price.product === "string"
              ? item.price.product
              : item.price.product.id;
          }

          if (productId) {
            const product = await getProductWithMetadata(productId);
            if (product) {
              await processProduct(userId, product);
            }
          }
        }
      }
    }

    else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = extractUserIdFromSubscription(subscription);

      if (!userId) {
        console.warn(`⚠️ ${event.type} sin userId en metadata`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`💰 Procesando ${event.type} para userId: ${userId}`);

      for (const item of subscription.items.data) {
        let productId: string | null = null;

        if (item.price?.product) {
          productId = typeof item.price.product === "string"
            ? item.price.product
            : item.price.product.id;
        }

        if (productId) {
          const product = await getProductWithMetadata(productId);
          if (product) {
            await processProduct(userId, product);
          }
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
