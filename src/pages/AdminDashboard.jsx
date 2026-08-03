import React, { useState } from "react";
import { db } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldX } from "lucide-react";
import AdminStats from "@/components/admin/AdminStats";
import AdminVets from "@/components/admin/AdminVets";
import AdminCases from "@/components/admin/AdminCases";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("stats");
  const queryClient = useQueryClient();

  const { data: vets = [], isLoading: loadingVets } = useQuery({
    queryKey: ["admin-vets"],
    queryFn: () => db.entities.Veterinary.list(),
  });
  const { data: lostPets = [], isLoading: loadingLost } = useQuery({
    queryKey: ["admin-lost"],
    queryFn: () => db.entities.LostPet.list(),
  });
  const { data: urgentCases = [], isLoading: loadingUrgent } = useQuery({
    queryKey: ["admin-urgent"],
    queryFn: () => db.entities.UrgentCase.list(),
  });
  const { data: adoptions = [], isLoading: loadingAdoptions } = useQuery({
    queryKey: ["admin-adoptions"],
    queryFn: () => db.entities.AdoptionPet.list(),
  });
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => db.entities.AbuseReport.list(),
  });

  const vetMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Veterinary.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-vets"] }),
  });

  const caseMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.UrgentCase.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-urgent"] }),
  });

  const lostMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.LostPet.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-lost"] }),
  });

  if (!user?.es_admin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <ShieldX className="w-16 h-16 text-destructive" />
        <h2 className="font-heading text-xl font-bold">Acceso restringido</h2>
        <p className="text-muted-foreground">Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  const isLoading = loadingVets || loadingLost || loadingUrgent || loadingAdoptions || loadingReports;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Estadísticas, verificaciones y moderación de contenido</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="vets">
            Veterinarias
            {vets.filter(v => !v.is_verified).length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {vets.filter(v => !v.is_verified).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cases">Casos & Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <AdminStats
            vets={vets}
            lostPets={lostPets}
            urgentCases={urgentCases}
            adoptions={adoptions}
            reports={reports}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="vets" className="mt-6">
          <AdminVets
            vets={vets}
            isLoading={loadingVets}
            onVerify={(vet) => vetMutation.mutate({ id: vet.id, data: { is_verified: true } })}
            onRevoke={(vet) => vetMutation.mutate({ id: vet.id, data: { is_verified: false } })}
            isPending={vetMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="cases" className="mt-6">
          <AdminCases
            urgentCases={urgentCases}
            lostPets={lostPets}
            reports={reports}
            isLoading={loadingUrgent || loadingLost || loadingReports}
            onUpdateCase={(id, data) => caseMutation.mutate({ id, data })}
            onUpdateLost={(id, data) => lostMutation.mutate({ id, data })}
            isCasePending={caseMutation.isPending}
            isLostPending={lostMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}