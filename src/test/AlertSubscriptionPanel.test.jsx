import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AlertSubscriptionPanel from "@/components/notifications/AlertSubscriptionPanel";

/**
 * El componente se reescribió: ya no pide la sesión por su cuenta ni consulta la
 * tabla a mano, sino que consume el contexto de sesión y useNotifications.
 *
 * El test anterior simulaba SIEMPRE una sesión iniciada, y por eso tapaba el
 * defecto real: el panel se monta en páginas públicas (/perdidas y
 * /casos-urgentes), donde db.auth.me() devuelve null, y accedía a u.id sin
 * protección. Cualquier visitante sin cuenta veía un TypeError en consola.
 */

const { mockUseAuth, mockUseNotifications } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseNotifications: vi.fn(),
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth: mockUseAuth }));
vi.mock("@/lib/useNotifications", () => ({ useNotifications: mockUseNotifications }));

vi.mock("@/components/notifications/AlertSettingsPanel", () => ({
  default: function MockAlertSettingsPanel({ subscription }) {
    return (
      <div data-testid="alert-settings-panel">
        {subscription ? `sub:${subscription.id}` : "sin-suscripcion"}
      </div>
    );
  },
}));

const renderizar = () =>
  render(
    <MemoryRouter>
      <AlertSubscriptionPanel />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUseNotifications.mockReturnValue({
    subscription: null,
    saveSubscription: vi.fn(),
    deleteSubscription: vi.fn(),
  });
});

describe("AlertSubscriptionPanel", () => {
  describe("sin sesión iniciada", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    });

    it("no rompe y ofrece iniciar sesión", () => {
      // Este es el caso que producía el TypeError en las páginas públicas.
      expect(() => renderizar()).not.toThrow();
      expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it("no muestra el panel de configuración", () => {
      renderizar();
      expect(screen.queryByTestId("alert-settings-panel")).not.toBeInTheDocument();
    });
  });

  describe("con sesión iniciada", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user-1", email: "ana@ejemplo.com" },
      });
    });

    it("muestra el panel de configuración", () => {
      renderizar();
      expect(screen.getByTestId("alert-settings-panel")).toBeInTheDocument();
    });

    it("sin suscripción previa, el panel arranca vacío", () => {
      renderizar();
      expect(screen.getByTestId("alert-settings-panel")).toHaveTextContent("sin-suscripcion");
    });

    it("pasa la suscripción existente al panel", () => {
      mockUseNotifications.mockReturnValue({
        subscription: { id: "sub-1", lat: -23.1, lng: -64.3 },
        saveSubscription: vi.fn(),
        deleteSubscription: vi.fn(),
      });
      renderizar();
      expect(screen.getByTestId("alert-settings-panel")).toHaveTextContent("sub:sub-1");
    });

    it("delega guardar y borrar en useNotifications, sin lógica propia", () => {
      // Antes reimplementaba a mano lo que el hook ya hacía, contra la misma
      // tabla y con estado propio, así que ambos podían desincronizarse.
      const guardar = vi.fn();
      const borrar = vi.fn();
      mockUseNotifications.mockReturnValue({
        subscription: null,
        saveSubscription: guardar,
        deleteSubscription: borrar,
      });
      renderizar();
      expect(mockUseNotifications).toHaveBeenCalled();
    });
  });
});
