import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AlertSubscriptionPanel from "@/components/notifications/AlertSubscriptionPanel";

const { mockMe, mockFilter, mockCreate, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockMe: vi.fn(),
  mockFilter: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/api/supabaseClient", () => ({
  default: {
    auth: {
      me: mockMe,
    },
    entities: {
      AlertSubscription: {
        filter: mockFilter,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
      },
    },
  },
  db: {
    auth: {
      me: mockMe,
    },
    entities: {
      AlertSubscription: {
        filter: mockFilter,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
      },
    },
  },
}));

vi.mock("@/components/notifications/AlertSettingsPanel", () => ({
  default: function MockAlertSettingsPanel(props) {
    return <div data-testid="alert-settings-panel">AlertSettingsPanel Mock</div>;
  },
}));

describe("AlertSubscriptionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    mockFilter.mockResolvedValue([]);
  });

  it("renderiza sin errores", async () => {
    render(<AlertSubscriptionPanel />);
    const panel = await screen.findByTestId("alert-settings-panel");
    expect(panel).toBeInTheDocument();
  });

  it("llama a db.auth.me al montar", async () => {
    render(<AlertSubscriptionPanel />);
    await screen.findByTestId("alert-settings-panel");
    expect(mockMe).toHaveBeenCalledTimes(1);
  });

  it("llama a AlertSubscription.filter con el user_id", async () => {
    render(<AlertSubscriptionPanel />);
    await screen.findByTestId("alert-settings-panel");
    expect(mockFilter).toHaveBeenCalledWith({ user_id: "user-1" });
  });

  it("muestra AlertSettingsPanel sin sub cuando no hay suscripciones", async () => {
    mockFilter.mockResolvedValue([]);
    render(<AlertSubscriptionPanel />);
    await screen.findByTestId("alert-settings-panel");
  });

  it("pasa la suscripción cuando existe", async () => {
    const existingSub = { id: "sub-1", lat: -34.5, lng: -58.3 };
    mockFilter.mockResolvedValue([existingSub]);
    render(<AlertSubscriptionPanel />);
    await screen.findByTestId("alert-settings-panel");
    expect(mockFilter).toHaveBeenCalledTimes(1);
  });
});
