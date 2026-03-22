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
      const session = await stripe.checkout.sessions.retrieve(
        (event.data.object as Stripe.Checkout.Session).id,
        {
          expand: ["line_items", "line_items.data.price.product"],
        }
      );

      let userId = session.client_reference_id;

      if (!userId && session.customer_details?.email) {
        console.log("🔍 ID no encontrado, buscando usuario por email...");
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        const { data: userData } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", session.customer_details.email.toLowerCase())
          .single();
        userId = userData?.id || null;
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

      let productsActivated: string[] = [];

      if (session.line_items?.data) {
        for (const item of session.line_items.data) {
          const productId = (item.price?.product as Stripe.Product)?.id;

          if (productId) {
            if (productId === STRIPE_PRODUCT_IDS.LIBRO) {
              updateData.has_book = true;
              productsActivated.push("Libro (Huevo de Obsidiana)");
            } else if (
              productId === STRIPE_PRODUCT_IDS.MENSUAL ||
              productId === STRIPE_PRODUCT_IDS.ANUAL
            ) {
              updateData.is_premium = true;
              const plan =
                productId === STRIPE_PRODUCT_IDS.MENSUAL
                  ? "Membresía Mensual"
                  : "Membresía Anual";
              productsActivated.push(plan);
            } else {
              console.log(`📦 Producto desconocido: ${productId}`);
            }
          }
        }
      }

      if (!updateData.is_premium && session.metadata?.product_type === 'premium') {
        console.log("🔍 Activando por metadata: product_type=premium");
        updateData.is_premium = true;
        productsActivated.push("Membresía (vía Metadata)");
      }

      if (productsActivated.length === 0) {
        console.log(`⚠️ No se reconocieron productos en la compra`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

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
    }

    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`\n📨 CUSTOMER.SUBSCRIPTION.CREATED`);
      console.log(`📨 Subscription ID: ${subscription.id}`);
      console.log(`📨 Status: ${subscription.status}`);

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      let customerId: string | null = null;
      let customerEmail: string | null = null;

      if (typeof subscription.customer === "string") {
        customerId = subscription.customer;
        console.log(`📨 Customer ID: ${customerId}`);

        try {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          customerEmail = customer.email || null;
          console.log(`🔍 Buscando usuario para membresía por Customer ID: ${customerId} -> Email: ${customerEmail}`);
        } catch (err) {
          console.error(`❌ Error obteniendo customer:`, err);
        }
      }

      let userId: string | null = null;

      if (customerEmail) {
        const { data: userData } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail.toLowerCase())
          .single();
        userId = userData?.id || null;
        console.log(`🔍 Usuario encontrado por email: ${userId || "NO ENCONTRADO"}`);
      }

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

      if (productId === STRIPE_PRODUCT_IDS.MENSUAL || productId === STRIPE_PRODUCT_IDS.ANUAL) {
        console.log(`👑 Activando is_premium=true para usuario: ${userId}`);

        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, is_premium: true }, { onConflict: "id" });

        if (upsertError) {
          console.error(`❌ Error en UPSERT: ${upsertError.message}`);
        } else {
          console.log(`✅ Success: Usuario ${userId} recibió Membresía Premium`);
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
