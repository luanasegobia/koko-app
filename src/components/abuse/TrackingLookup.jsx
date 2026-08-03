import React, { useState } from "react";
import { db } from "@/api/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Loader2, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels = { pendiente: "Pendiente", en_revision: "En revisión", derivada: "Derivada", resuelta: "Resuelta" };
const statusColors = { pendiente: "bg-accent/10 text-accent", en_revision: "bg-blue-500/10 text-blue-600", derivada: "bg-purple-500/10 text-purple-600", resuelta: "bg-primary/10 text-primary" };

export default function TrackingLookup() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const reports = await db.entities.AbuseReport.filter({ tracking_code: code.toUpperCase() });
    if (reports.length > 0) {
      setResult(reports[0]);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Código de seguimiento" required className="flex-1 font-mono uppercase" />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {notFound && (
        <p className="text-sm text-muted-foreground text-center py-4">No se encontró ninguna denuncia con ese código.</p>
      )}

      {result && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={statusColors[result.status]}>{statusLabels[result.status]}</Badge>
            <span className="text-xs text-muted-foreground font-mono">#{result.tracking_code}</span>
          </div>
          <p className="text-sm">{result.description}</p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {result.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.address}</span>}
            {result.created_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(result.created_date), "d MMM yyyy", { locale: es })}</span>}
          </div>
        </Card>
      )}
    </div>
  );
}