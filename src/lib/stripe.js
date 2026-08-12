import { supabase } from "@/api/supabaseClient";

// Se eliminó getStripe()/loadStripe: nadie los llamaba. El pago no se monta en
// la página, se redirige al Checkout alojado por Stripe.

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
