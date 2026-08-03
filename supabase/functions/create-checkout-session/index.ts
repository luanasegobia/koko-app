import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { caseId, title, amount, donationAlias, successUrl, cancelUrl } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "ars",
            product_data: {
              name: `Donación: ${title}`,
              description: `Colaboración para caso urgente: ${title}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        case_id: caseId,
        donation_alias: donationAlias || "",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
