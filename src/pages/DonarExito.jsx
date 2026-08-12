import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Heart } from "lucide-react";

/**
 * Esta página solo confirma visualmente el resultado del pago.
 *
 * Antes incrementaba el contador de recaudación desde el navegador, sumando un
 * hardcodeado +1 (un peso, no el monto donado) sobre una URL que cualquiera
 * podía abrir a mano. Además la política de la tabla lo bloqueaba y el error se
 * tragaba con un .catch(() => {}), así que en la práctica nunca hizo nada.
 *
 * El contador real lo tiene que escribir un webhook de Stripe con la clave de
 * servicio, que es la única fuente que puede confirmar que el pago se acreditó.
 * Queda pendiente para cuando se habiliten las donaciones con tarjeta.
 */
export default function DonarExito() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {status === "exito" ? (
          <>
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h1 className="font-heading text-2xl font-bold">¡Gracias por tu donación!</h1>
            <p className="text-muted-foreground">
              Tu colaboración ayuda a cambiar la vida de un animal que lo necesita.
            </p>
          </>
        ) : status === "cancelado" ? (
          <>
            <XCircle className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="font-heading text-2xl font-bold">Donación cancelada</h1>
            <p className="text-muted-foreground">
              No se realizó ningún cargo. Si querés intentarlo de nuevo, volvé al caso urgente.
            </p>
          </>
        ) : (
          <>
            <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="font-heading text-2xl font-bold">Página no válida</h1>
            <p className="text-muted-foreground">Esta página solo es accesible desde un proceso de pago.</p>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/casos-urgentes">Volver a casos urgentes</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to="/">Ir al inicio</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
