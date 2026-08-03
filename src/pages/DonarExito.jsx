import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Heart, Loader2 } from "lucide-react";
import { db } from "@/api/supabaseClient";

export default function DonarExito() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const caseId = searchParams.get("case_id");
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (status === "exito" && caseId) {
      setActualizando(true);
      db.entities.UrgentCase.get(caseId).then((caso) => {
        if (caso) {
          return db.entities.UrgentCase.update(caseId, {
            raised_amount: (caso.raised_amount || 0) + 1,
            contributors_count: (caso.contributors_count || 0) + 1,
          });
        }
      }).catch(() => {}).finally(() => setActualizando(false));
    }
  }, [status, caseId]);

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
            {actualizando && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Actualizando contador...
              </p>
            )}
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
