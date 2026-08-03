import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Loader2 } from "lucide-react";
import { redirigirAStripe } from "@/lib/stripe";

export default function BotonDonarStripe({ caseId, title, donationAlias }) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDonar = async (e) => {
    e.preventDefault();
    const cantidad = parseFloat(monto);
    if (!cantidad || cantidad < 100) {
      setError("El monto mínimo es $100");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await redirigirAStripe({ caseId, title, amount: cantidad, donationAlias });
    } catch (err) {
      setError(err.message || "Error al procesar el pago");
      setLoading(false);
    }
  };

  return (
    <>
      <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => setOpen(true)}>
        <Heart className="w-4 h-4 mr-1" /> Donar con tarjeta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Donar a {title}</DialogTitle>
            <DialogDescription>
              Elegí el monto que querés donar. El pago se procesa de forma segura con Stripe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDonar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                min="100"
                step="100"
                placeholder="Ej: 5000"
                value={monto}
                onChange={(e) => { setMonto(e.target.value); setError(""); }}
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Donar ${monto ? parseFloat(monto).toLocaleString("es-AR") : "—"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
