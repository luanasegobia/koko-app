import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/api/supabaseClient";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise = null;

function getStripe() {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export async function crearSesionDonacion({ caseId, title, amount, donationAlias }) {
  const baseUrl = window.location.origin;
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      caseId,
      title,
      amount,
      donationAlias,
      successUrl: `${baseUrl}/donar/exito?case_id=${caseId}&status=exito`,
      cancelUrl: `${baseUrl}/donar/exito?case_id=${caseId}&status=cancelado`,
    },
  });

  if (error) throw new Error(error.message || "Error al crear sesión de pago");

  return data;
}

export async function redirigirAStripe({ caseId, title, amount, donationAlias }) {
  const data = await crearSesionDonacion({ caseId, title, amount, donationAlias });
  window.location.href = data.url;
}
