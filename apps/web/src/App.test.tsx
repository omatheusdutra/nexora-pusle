import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

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

describe("App", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

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
            teamName: "Time Cartoes",
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
            teamName: "Time Cartoes",
            teamType: "CARDS",
            isOnline: true,
            currentLoad: 1,
            maxConcurrentAttendances: 3,
            utilization: 33
          }
        ]);
      }

      return jsonResponse([
        {
          id: "att-1",
          customerName: "Maria Silva",
          subject: "Problemas com cartao",
          status: "IN_PROGRESS",
          teamName: "Time Cartoes",
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
  });

  it("renders dashboard data", async () => {
    render(<App />);

    expect(await screen.findAllByText("Nexora Pulse")).not.toHaveLength(0);
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(await screen.findAllByText("Ana Martins")).toHaveLength(2);
  });
});
