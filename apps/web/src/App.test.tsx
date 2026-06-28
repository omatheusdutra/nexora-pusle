import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { queryClient } from "./lib/query-client";

vi.mock("socket.io-client", () => ({
  io: () => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn()
  })
}));

const mockFetch = vi.fn();

function jsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body)
  } as Response);
}

function errorResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body)
  } as Response);
}

describe("App", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/auth/me")) {
        return jsonResponse({
          user: {
            id: "user-admin",
            name: "Lucas Almeida",
            email: "admin@nexora.local",
            role: "ADMIN"
          }
        });
      }

      if (url.includes("/summary")) {
        return jsonResponse({
          totalAttendances: 3,
          inProgress: 1,
          queued: 1,
          finished: 1,
          cancelled: 0,
          onlineAttendants: 6,
          totalCapacity: 18,
          usedCapacity: 1,
          capacityUtilization: 6,
          averageWaitSeconds: 12
        });
      }

      if (url.includes("/queues")) {
        return jsonResponse([
          {
            teamId: "team-cards",
            teamName: "Time Cartões",
            teamType: "CARDS",
            queued: 1,
            oldestQueuedAt: new Date().toISOString()
          }
        ]);
      }

      if (url.includes("/attendants-load")) {
        return jsonResponse([
          {
            attendantId: "agent-1",
            name: "Ana Martins",
            teamId: "team-cards",
            teamName: "Time Cartões",
            teamType: "CARDS",
            isOnline: true,
            currentLoad: 1,
            maxConcurrentAttendances: 3,
            utilization: 33
          }
        ]);
      }

      if (url.includes("/audit-events")) {
        return jsonResponse({
          data: [],
          page: 1,
          pageSize: 8,
          total: 0,
          totalPages: 0
        });
      }

      if (url.includes("/attendances?")) {
        return jsonResponse({
          data: [
            {
              id: "att-1",
              customerName: "Maria Silva",
              subject: "Problemas com cartão",
              status: "IN_PROGRESS",
              team: {
                id: "team-cards",
                name: "Time Cartões",
                type: "CARDS"
              },
              teamId: "team-cards",
              attendantId: "agent-1",
              attendant: {
                id: "agent-1",
                name: "Ana Martins"
              },
              queuedAt: new Date().toISOString(),
              startedAt: new Date().toISOString(),
              finishedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1
        });
      }

      return jsonResponse([
        {
          id: "att-1",
          customerName: "Maria Silva",
          subject: "Problemas com cartão",
          status: "IN_PROGRESS",
          teamName: "Time Cartões",
          attendantName: "Ana Martins",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    });
    vi.stubGlobal("fetch", mockFetch);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
    queryClient.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders dashboard data", async () => {
    render(<App />);

    expect(await screen.findAllByText("Nexora Pulse")).not.toHaveLength(0);
    expect(await screen.findByText("Lucas Almeida")).toBeInTheDocument();
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(await screen.findAllByText("Ana Martins")).not.toHaveLength(0);
  });

  it("redirects protected routes to login when unauthenticated", async () => {
    window.history.pushState({}, "", "/dashboard");
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/auth/me")) {
        return errorResponse(401, {
          code: "UNAUTHENTICATED",
          error: "Autenticação obrigatória"
        });
      }

      return jsonResponse({});
    });

    render(<App />);

    expect(await screen.findAllByText("Entrar na Nexora Pulse")).not.toHaveLength(
      0
    );
  });

  it("shows a generic error for invalid login", async () => {
    window.history.pushState({}, "", "/login");
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/auth/me") || url.includes("/auth/login")) {
        return errorResponse(401, {
          code: "UNAUTHENTICATED",
          error: "Credenciais inválidas"
        });
      }

      return jsonResponse({});
    });
    const user = userEvent.setup();

    render(<App />);

    await user.clear(await screen.findByPlaceholderText("usuario@nexora.local"));
    await user.type(
      screen.getByPlaceholderText("usuario@nexora.local"),
      "admin@nexora.local"
    );
    await user.clear(screen.getByPlaceholderText("Digite sua senha"));
    await user.type(screen.getByPlaceholderText("Digite sua senha"), "errada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText(/Credenciais inválidas/i)
    ).toBeInTheDocument();
  });
});
