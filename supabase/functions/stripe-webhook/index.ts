import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const LIBRO_PRODUCT_ID = "prod_UAUdLWq6RAMf5F";
const PREMIUM_PRODUCT_IDS = ["prod_UAUmlnCoj6k871", "prod_UAUo8C4iYIaPv9"];

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function findUserByEmail(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return data?.id || null;
}

async function activateField(userId: string, field: "is_premium" | "has_book") {
  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, [field]: true }, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }

  console.log(`✅ Éxito: ${field} puesto en TRUE.`);
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      let userId = session.client_reference_id;
      const email = session.customer_details?.email || null;

      if (!userId && email) {
        userId = await findUserByEmail(email);
      }

      if (!userId) {
        console.warn("⚠️ No se pudo identificar al usuario");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const sessionExpanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });

      const lineItems = sessionExpanded.line_items?.data || [];

      for (const item of lineItems) {
        const productId = typeof item.price?.product === "string"
          ? item.price.product
          : item.price?.product?.id;

        if (!productId) continue;

        const isPremiumProduct = PREMIUM_PRODUCT_IDS.includes(productId);
        const isLibroProduct = productId === LIBRO_PRODUCT_ID;

        if (isLibroProduct) {
          console.log(`🔍 Procesando Producto: ${productId} para el usuario: ${email || userId}`);
          await activateField(userId, "has_book");
        } else if (isPremiumProduct) {
          console.log(`🔍 Procesando Producto: ${productId} para el usuario: ${email || userId}`);
          await activateField(userId, "is_premium");
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
