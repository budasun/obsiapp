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

async function activatePremium(userId: string, session?: Stripe.Checkout.Session) {
  const updateData: Record<string, unknown> = {
    id: userId,
    is_premium: true,
  };

  if (session?.customer_details) {
    updateData.email = session.customer_details.email || null;
    updateData.full_name = session.customer_details.name || null;
  }

  console.log(`👑 Activando membresía Premium para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(updateData, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error activando Premium: ${error.message}`);
    return false;
  }

  console.log(`✅ Usuario ${userId} es ahora Premium`);
  return true;
}

async function activateBook(userId: string, session?: Stripe.Checkout.Session) {
  const updateData: Record<string, unknown> = {
    id: userId,
    has_book: true,
  };

  if (session?.customer_details) {
    updateData.email = session.customer_details.email || null;
    updateData.full_name = session.customer_details.name || null;
  }

  console.log(`📚 Activando acceso al Libro para usuario: ${userId}`);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(updateData, { onConflict: "id" });

  if (error) {
    console.error(`❌ Error activando Book: ${error.message}`);
    return false;
  }

  console.log(`✅ Usuario ${userId} tiene acceso al Libro`);
  return true;
}

function isPremiumProduct(product: Stripe.Product): boolean {
  return product.metadata?.product_type === "premium";
}

async function getUserIdFromSession(session: Stripe.Checkout.Session): Promise<string | null> {
  return session.client_reference_id || null;
}

async function getUserIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  return (
    subscription.metadata?.client_reference_id ||
    subscription.metadata?.user_id ||
    subscription.metadata?.customer_id ||
    null
  );
}

async function getUserIdFromInvoice(invoice: Stripe.Invoice): Promise<string | null> {
  if (invoice.metadata?.client_reference_id) {
    return invoice.metadata.client_reference_id;
  }

  if (invoice.subscription && typeof invoice.subscription === "string") {
    try {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      return (
        subscription.metadata?.client_reference_id ||
        subscription.metadata?.user_id ||
        null
      );
    } catch {
      return null;
    }
  }

  return null;
}

async function getProductFromLineItem(item: Stripe.LineItem): Promise<Stripe.Product | null> {
  if (item.price?.product && typeof item.price.product !== "string") {
    return item.price.product as Stripe.Product;
  }

  if (item.price?.product && typeof item.price.product === "string") {
    try {
      return await stripe.products.retrieve(item.price.product);
    } catch {
      return null;
    }
  }

  return null;
}

async function getProductFromSubscriptionItem(item: Stripe.SubscriptionItem): Promise<Stripe.Product | null> {
  if (item.price?.product && typeof item.price.product !== "string") {
    return item.price.product as Stripe.Product;
  }

  if (item.price?.product && typeof item.price.product === "string") {
    try {
      return await stripe.products.retrieve(item.price.product);
    } catch {
      return null;
    }
  }

  return null;
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
      const userId = await getUserIdFromSession(session);

      if (!userId) {
        console.warn("⚠️ checkout.session.completed sin client_reference_id");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (session.line_items?.data) {
        for (const item of session.line_items.data) {
          const product = await getProductFromLineItem(item);

          if (product) {
            if (product.id === LIBRO_PRODUCT_ID) {
              await activateBook(userId, session);
            } else if (isPremiumProduct(product)) {
              await activatePremium(userId, session);
            } else {
              console.log(`📦 Producto no reconocido: ${product.id}`);
            }
          }
        }
      }
    }

    else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getUserIdFromInvoice(invoice);

      if (!userId) {
        console.warn("⚠️ invoice.paid sin userId detectable");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (invoice.subscription && typeof invoice.subscription !== "string") {
        const subscription = invoice.subscription;

        for (const item of subscription.items.data) {
          const product = await getProductFromSubscriptionItem(item);

          if (product) {
            if (product.id === LIBRO_PRODUCT_ID) {
              await activateBook(userId);
            } else if (isPremiumProduct(product)) {
              await activatePremium(userId);
            }
          }
        }
      } else if (invoice.subscription && typeof invoice.subscription === "string") {
        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price.product"],
          });

          for (const item of subscription.items.data) {
            const product = await getProductFromSubscriptionItem(item);

            if (product) {
              if (product.id === LIBRO_PRODUCT_ID) {
                await activateBook(userId);
              } else if (isPremiumProduct(product)) {
                await activatePremium(userId);
              }
            }
          }
        } catch (err) {
          console.error("Error procesando invoice.paid:", err);
        }
      }
    }

    else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await getUserIdFromSubscription(subscription);

      if (!userId) {
        console.warn(`⚠️ ${event.type} sin userId en metadata`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      for (const item of subscription.items.data) {
        const product = await getProductFromSubscriptionItem(item);

        if (product) {
          if (product.id === LIBRO_PRODUCT_ID) {
            await activateBook(userId);
          } else if (isPremiumProduct(product)) {
            await activatePremium(userId);
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
