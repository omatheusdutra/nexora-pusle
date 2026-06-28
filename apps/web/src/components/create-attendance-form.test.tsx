import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateAttendanceForm } from "./create-attendance-form";

const mockFetch = vi.fn();

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CreateAttendanceForm />
    </QueryClientProvider>
  );
}

describe("CreateAttendanceForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("submits a new attendance", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          result: "ASSIGNED",
          message: "Atendimento atribuído automaticamente",
          attendance: {
            id: "att-1",
            customerName: "Maria Silva",
            subject: "Problemas com cartão",
            status: "IN_PROGRESS"
          }
        })
    });
    vi.stubGlobal("fetch", mockFetch);
    const user = userEvent.setup();

    renderForm();

    await user.clear(screen.getByLabelText("Cliente"));
    await user.type(screen.getByLabelText("Cliente"), "Maria Silva");
    await user.click(screen.getByRole("button", { name: /criar atendimento/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/attendances"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
