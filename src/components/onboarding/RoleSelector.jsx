import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Building2, User, ShieldCheck, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    value: "usuario",
    label: "Usuario común",
    description: "Quiero adoptar, reportar mascotas perdidas o colaborar con casos.",
    icon: User,
    color: "border-primary/40 hover:border-primary bg-primary/5",
    selectedColor: "border-primary bg-primary/10 ring-2 ring-primary/30",
    iconColor: "text-primary",
  },
  {
    value: "rescatista",
    label: "Rescatista / Organización",
    description: "Rescato animales o represento una ONG. Puedo publicar casos solidarios con alias de donación y gestionar su estado.",
    icon: PawPrint,
    color: "border-accent/40 hover:border-accent bg-accent/5",
    selectedColor: "border-accent bg-accent/10 ring-2 ring-accent/30",
    iconColor: "text-accent",
    badge: "Verificado",
  },
  {
    value: "organizacion",
    label: "Organización / ONG",
    description: "Represento una organización protectora de animales.",
    icon: Building2,
    color: "border-blue-400/40 hover:border-blue-400 bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-300",
    iconColor: "text-blue-500",
    badge: "Verificado",
  },
  {
    value: "veterinario",
    label: "Veterinario / Clínica",
    description: "Soy profesional veterinario o represento una clínica. Mi perfil será revisado para aparecer en el directorio.",
    icon: Stethoscope,
    color: "border-purple-400/40 hover:border-purple-400 bg-purple-50",
    selectedColor: "border-purple-500 bg-purple-50 ring-2 ring-purple-300",
    iconColor: "text-purple-500",
  },
];

export default function RoleSelector({ selected, onSelect }) {
  return (
    <div className="grid gap-3">
      {roles.map((role, i) => {
        const Icon = role.icon;
        const isSelected = selected === role.value;
        return (
          <motion.button
            key={role.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(role.value)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4",
              isSelected ? role.selectedColor : role.color
            )}
          >
            <div className={cn("mt-0.5 p-2 rounded-lg bg-white/80 shadow-sm", role.iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{role.label}</p>
                {role.badge && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> {role.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
            </div>
            {isSelected && (
              <ShieldCheck className="w-5 h-5 text-primary ml-auto mt-0.5 shrink-0" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}