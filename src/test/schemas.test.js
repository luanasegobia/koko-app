import { describe, it, expect } from "vitest";
import {
  mascotaSchema,
  mascotaPerdidaSchema,
  mascotaAdopcionSchema,
  veterinariaSchema,
  casoUrgenteSchema,
  denunciaSchema,
} from "@/schemas";

describe("mascotaSchema", () => {
  it("valida datos correctos", () => {
    const data = { name: "Firulais", species: "perro" };
    const result = mascotaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = mascotaSchema.safeParse({ name: "", species: "gato" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El nombre es obligatorio");
  });

  it("rechaza especie inválida", () => {
    const result = mascotaSchema.safeParse({ name: "Firulais", species: "pez" });
    expect(result.success).toBe(false);
  });

  it("aplica valores por defecto en campos opcionales", () => {
    const result = mascotaSchema.safeParse({ name: "Firulais", species: "perro" });
    expect(result.success).toBe(true);
    expect(result.data.breed).toBe("");
    expect(result.data.photo_url).toBe("");
    expect(result.data.description).toBe("");
    expect(result.data.allergies).toBe("");
    expect(result.data.owner_name).toBe("");
    expect(result.data.owner_phone).toBe("");
    expect(result.data.owner_whatsapp).toBe("");
  });
});

describe("mascotaPerdidaSchema", () => {
  it("valida datos correctos con solo campos requeridos", () => {
    const data = { pet_name: "Luna", species: "gato" };
    const result = mascotaPerdidaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza pet_name vacío", () => {
    const result = mascotaPerdidaSchema.safeParse({ pet_name: "", species: "perro" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El nombre es obligatorio");
  });

  it("rechaza especie inválida", () => {
    const result = mascotaPerdidaSchema.safeParse({ pet_name: "Luna", species: "loro" });
    expect(result.success).toBe(false);
  });

  it("aplica valores por defecto en campos opcionales", () => {
    const result = mascotaPerdidaSchema.safeParse({ pet_name: "Luna", species: "gato" });
    expect(result.success).toBe(true);
    expect(result.data.breed).toBe("");
    expect(result.data.photo_url).toBe("");
    expect(result.data.description).toBe("");
    expect(result.data.last_seen_address).toBe("");
    expect(result.data.contact_phone).toBe("");
    expect(result.data.contact_whatsapp).toBe("");
  });

  it("acepta todos los campos opcionales", () => {
    const data = {
      pet_name: "Max",
      species: "otro",
      breed: "Conejo",
      age_years: 2,
      photo_url: "https://example.com/photo.jpg",
      description: "Conejo blanco",
      last_seen_address: "Calle 123",
      contact_phone: "123456789",
      contact_whatsapp: "987654321",
    };
    const result = mascotaPerdidaSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data.pet_name).toBe("Max");
    expect(result.data.breed).toBe("Conejo");
    expect(result.data.age_years).toBe(2);
    expect(result.data.contact_phone).toBe("123456789");
  });

  it("convierte age_years a número con coerce", () => {
    const result = mascotaPerdidaSchema.safeParse({ pet_name: "Max", species: "perro", age_years: "3" });
    expect(result.success).toBe(true);
    expect(result.data.age_years).toBe(3);
  });

  it("rechaza age_years negativo", () => {
    const result = mascotaPerdidaSchema.safeParse({ pet_name: "Max", species: "perro", age_years: -1 });
    expect(result.success).toBe(false);
  });
});

describe("mascotaAdopcionSchema", () => {
  it("valida datos correctos", () => {
    const data = { name: "Rocky", species: "perro" };
    const result = mascotaAdopcionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = mascotaAdopcionSchema.safeParse({ name: "", species: "gato" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El nombre es obligatorio");
  });

  it("rechaza tamaño inválido", () => {
    const result = mascotaAdopcionSchema.safeParse({ name: "Rocky", species: "perro", size: "enorme" });
    expect(result.success).toBe(false);
  });

  it("aplica valores por defecto booleanos", () => {
    const result = mascotaAdopcionSchema.safeParse({ name: "Rocky", species: "perro" });
    expect(result.success).toBe(true);
    expect(result.data.vaccinated).toBe(false);
    expect(result.data.sterilized).toBe(false);
  });
});

describe("veterinariaSchema", () => {
  it("valida datos correctos", () => {
    const data = { name: "Vet Centro", address: "Av. Siempre Viva 123", phone: "123456789" };
    const result = veterinariaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = veterinariaSchema.safeParse({ name: "", address: "Calle 1", phone: "123" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El nombre es obligatorio");
  });

  it("rechaza dirección vacía", () => {
    const result = veterinariaSchema.safeParse({ name: "Vet", address: "", phone: "123" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("La dirección es obligatoria");
  });

  it("rechaza teléfono vacío", () => {
    const result = veterinariaSchema.safeParse({ name: "Vet", address: "Calle 1", phone: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El teléfono es obligatorio");
  });

  it("aplica is_emergency por defecto como false", () => {
    const result = veterinariaSchema.safeParse({ name: "Vet", address: "Calle 1", phone: "123" });
    expect(result.success).toBe(true);
    expect(result.data.is_emergency).toBe(false);
    expect(result.data.services).toBe("");
    expect(result.data.bio).toBe("");
  });
});

describe("casoUrgenteSchema", () => {
  it("valida datos correctos", () => {
    const data = { title: "Ayuda urgente", description: "Se necesita ayuda" };
    const result = casoUrgenteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza título vacío", () => {
    const result = casoUrgenteSchema.safeParse({ title: "", description: "Descripción" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("El título es obligatorio");
  });

  it("rechaza descripción vacía", () => {
    const result = casoUrgenteSchema.safeParse({ title: "Título", description: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("La descripción es obligatoria");
  });

  it("aplica valores por defecto", () => {
    const result = casoUrgenteSchema.safeParse({ title: "Título", description: "Descripción" });
    expect(result.success).toBe(true);
    expect(result.data.goal_amount).toBe(0);
    expect(result.data.donation_alias).toBe("");
    expect(result.data.photo_url).toBe("");
  });

  it("convierte goal_amount a número", () => {
    const result = casoUrgenteSchema.safeParse({ title: "Título", description: "Descripción", goal_amount: "500" });
    expect(result.success).toBe(true);
    expect(result.data.goal_amount).toBe(500);
  });
});

describe("denunciaSchema", () => {
  it("valida datos correctos", () => {
    const data = { type: "regular", description: "Descripción de la denuncia" };
    const result = denunciaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rechaza tipo inválido", () => {
    const result = denunciaSchema.safeParse({ type: "invalido", description: "Descripción" });
    expect(result.success).toBe(false);
  });

  it("rechaza descripción vacía", () => {
    const result = denunciaSchema.safeParse({ type: "urgente", description: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("La descripción es obligatoria");
  });

  it("acepta tipo anonima", () => {
    const result = denunciaSchema.safeParse({ type: "anonima", description: "Denuncia anónima" });
    expect(result.success).toBe(true);
  });

  it("aplica valores por defecto", () => {
    const result = denunciaSchema.safeParse({ type: "urgente", description: "Descripción" });
    expect(result.success).toBe(true);
    expect(result.data.address).toBe("");
    expect(result.data.reporter_name).toBe("");
    expect(result.data.reporter_phone).toBe("");
  });
});
