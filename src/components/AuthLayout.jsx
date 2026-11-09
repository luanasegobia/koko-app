import React from "react";
import { PatitaEsquina } from "@/components/PatitaKoko";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <PatitaEsquina />

      <div className="relative z-[1] w-full max-w-md">
        <div className="mb-7 px-2">
          <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.3em] text-primary">
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Koko · Comunidad Mascotera
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-[1.15] tracking-[.01em] text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm font-medium leading-[1.4] text-foreground/75">{subtitle}</p>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-[13px] font-semibold text-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}
