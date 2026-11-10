import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

// SUPABASE_URL y SUPABASE_ANON_KEY los inyecta Supabase en toda función.
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Sitios a los que Stripe puede devolver a la persona después de pagar. En
// producción se define el secreto ORIGENES_PERMITIDOS con el dominio real,
// separado por comas si hay más de uno.
const origenesPermitidos = (Deno.env.get("ORIGENES_PERMITIDOS") || "http://localhost:5175")
  .split(",")
  .map((origen) => origen.trim().replace(/\/$/, ""))
  .filter(Boolean);

// En pesos. El mínimo coincide con el del formulario.
const MONTO_MINIMO = 100;
const MONTO_MAXIMO = 1_000_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function responder(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

/**
 * El caso se lee de la base en vez de confiar en lo que mande el navegador: la
 * clave anónima es pública, así que el cuerpo del pedido lo puede armar
 * cualquiera. Los casos urgentes son de lectura pública, alcanza con esa clave.
 */
async function buscarCaso(caseId: string) {
  const respuesta = await fetch(
    `${supabaseUrl}/rest/v1/urgent_case?id=eq.${caseId}&select=id,title,donation_alias,status`,
    { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } },
  );
  if (!respuesta.ok) throw new Error("No se pudo consultar el caso.");
  const casos = await respuesta.json();
  return casos[0] ?? null;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return responder({ error: "Método no permitido." }, 405);
  }
  if (!stripeKey) {
    return responder({ error: "El pago con tarjeta no está configurado." }, 503);
  }

  // Las URLs de retorno se arman acá, a partir de un origen de la lista. Si las
  // eligiera quien llama, se podría usar el Checkout de Koko para mandar gente
  // a cualquier sitio.
  const origen = (req.headers.get("origin") || "").replace(/\/$/, "");
  if (!origenesPermitidos.includes(origen)) {
    return responder({ error: "Origen no permitido." }, 403);
  }

  try {
    const { caseId, amount } = await req.json();

    if (typeof caseId !== "string" || !UUID.test(caseId)) {
      return responder({ error: "El caso no es válido." }, 400);
    }
    const monto = Number(amount);
    if (!Number.isFinite(monto) || monto < MONTO_MINIMO || monto > MONTO_MAXIMO) {
      return responder(
        { error: `El monto tiene que estar entre $${MONTO_MINIMO} y $${MONTO_MAXIMO}.` },
        400,
      );
    }

    const caso = await buscarCaso(caseId);
    if (!caso) {
      return responder({ error: "No encontramos ese caso." }, 404);
    }
    if (caso.status === "resuelto") {
      return responder({ error: "Este caso ya está resuelto y no recibe donaciones." }, 409);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "ars",
            product_data: {
              name: `Donación: ${caso.title}`,
              description: `Colaboración para caso urgente: ${caso.title}`,
            },
            unit_amount: Math.round(monto * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        case_id: caso.id,
        donation_alias: caso.donation_alias || "",
      },
      success_url: `${origen}/donar/exito?case_id=${caso.id}&status=exito`,
      cancel_url: `${origen}/donar/exito?case_id=${caso.id}&status=cancelado`,
    });

    return responder({ sessionId: session.id, url: session.url }, 200);
  } catch (err) {
    // El detalle queda en los logs de la función; a quien llama no se le
    // devuelven mensajes internos de Stripe ni de la base.
    console.error("create-checkout-session:", err);
    return responder({ error: "No se pudo iniciar el pago." }, 400);
  }
});
