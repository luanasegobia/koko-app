import { describe, it, expect } from "vitest";
import { createPageUrl } from "@/utils";

describe("createPageUrl", () => {
  it("convierte nombre de página simple a url", () => {
    expect(createPageUrl("inicio")).toBe("/inicio");
  });

  it("reemplaza espacios por guiones", () => {
    expect(createPageUrl("mascotas perdidas")).toBe("/mascotas-perdidas");
  });

  it("maneja múltiples espacios", () => {
    expect(createPageUrl("casos  urgentes")).toBe("/casos--urgentes");
  });

  it("devuelve solo / para string vacío", () => {
    expect(createPageUrl("")).toBe("/");
  });

  it("maneja nombres con guiones ya existentes", () => {
    expect(createPageUrl("mi-perfil")).toBe("/mi-perfil");
  });

  it("no modifica mayúsculas", () => {
    expect(createPageUrl("Inicio")).toBe("/Inicio");
  });
});
