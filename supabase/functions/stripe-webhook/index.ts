import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

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
      
      // El client_reference_id debe contener el UUID del usuario de Supabase
      const userId = session.client_reference_id;

      if (userId) {
        console.log(`Procesando Premium para: ${userId}`);

        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // EXTRA SEGURO: Usamos upsert en lugar de update. 
        // Si el perfil no existe todavía (race condition), lo crea con Premium.
        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert({ 
            id: userId, 
            is_premium: true,
            email: session.customer_details?.email || null, // Guardamos el email por si acaso es nuevo
            full_name: session.customer_details?.name || "Premium User"
          }, { onConflict: 'id' });

        if (upsertError) {
          console.error(`Error en UPSERT: ${upsertError.message}`);
          return new Response(`Error: ${upsertError.message}`, { status: 500 });
        }

        console.log(`✅ Success: Usuario ${userId} es ahora Premium.`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`Error en Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
