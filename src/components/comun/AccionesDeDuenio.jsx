import React, { useState } from "react";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { mensajeDeError } from "@/lib/mensajeDeError";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Menú de "⋯" con Editar y Eliminar sobre una publicación propia.
 *
 * Hasta ahora la app no tenía forma de que alguien corrigiera o diera de baja
 * lo que publicó: solo existía crear y ver, más los cambios de estado desde
 * administración. Este componente es el mismo patrón para los seis módulos.
 *
 * Los permisos que decide acá son solo de interfaz: quien manda es la política
 * de la base de datos. Esto evita mostrar botones que van a fallar.
 */
export default function AccionesDeDuenio({
  registro,
  columnaAutor = "created_by_id",
  onEditar,
  onEliminar,
  soloAdminPuedeEliminar = false,
  etiqueta = "esta publicación",
}) {
  const { user } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  const esDuenio = Boolean(user?.id) && user.id === registro?.[columnaAutor];
  const esAdmin = user?.es_admin === true;

  const puedeEditar = esDuenio || esAdmin;
  const puedeEliminar = soloAdminPuedeEliminar ? esAdmin : esDuenio || esAdmin;

  if (!puedeEditar && !puedeEliminar) return null;

  const confirmarEliminacion = async () => {
    setEliminando(true);
    setError(null);
    try {
      await onEliminar();
      setConfirmando(false);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`Acciones sobre ${etiqueta}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {puedeEditar && onEditar && (
            <DropdownMenuItem onClick={onEditar}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {puedeEliminar && onEliminar && (
            <DropdownMenuItem
              onClick={() => setConfirmando(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">¿Eliminar {etiqueta}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Sin esto el diálogo se cierra antes de saber si el borrado
                // funcionó, y un error de permisos pasaría desapercibido.
                e.preventDefault();
                confirmarEliminacion();
              }}
              disabled={eliminando}
              className="bg-destructive hover:bg-destructive/90"
            >
              {eliminando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
