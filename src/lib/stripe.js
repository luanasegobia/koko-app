import { supabase } from "@/api/supabaseClient";

// Se eliminó getStripe()/loadStripe: nadie los llamaba. El pago no se monta en
// la página, se redirige al Checkout alojado por Stripe.

// Solo viajan el caso y el monto. El título, el alias y las URLs de retorno los
// resuelve la función del lado del servidor: si los mandara el navegador,
// cualquiera podría crear un pago con otro texto y otro destino.
export async function crearSesionDonacion({ caseId, amount }) {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { caseId, amount },
  });

  if (error) throw new Error(error.message || "Error al crear sesión de pago");

  return data;
}

export async function redirigirAStripe({ caseId, amount }) {
  const data = await crearSesionDonacion({ caseId, amount });
  if (!data?.url) throw new Error("No se pudo iniciar el pago");
  window.location.href = data.url;
}
