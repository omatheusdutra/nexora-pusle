import { describe, expect, it } from "vitest";
import { InMemoryWorkflow } from "../src/infrastructure/repositories/in-memory-workflow";

describe("InMemoryWorkflow", () => {
  it("queues attendance when all attendants in the team are full", async () => {
    const workflow = new InMemoryWorkflow();
    const created = [];

    for (let index = 0; index < 7; index += 1) {
      created.push(
        await workflow.createAttendance({
          customerName: `Cliente ${index}`,
          subject: "Problemas com cartao"
        })
      );
    }

    const statuses = created.map((item) => item.data.attendance.status);
    expect(statuses.filter((status) => status === "IN_PROGRESS")).toHaveLength(
      6
    );
    expect(statuses.filter((status) => status === "QUEUED")).toHaveLength(1);

    const attendants = await workflow.getAttendantsLoad();
    const cardLoads = attendants.filter((item) => item.teamType === "CARDS");
    expect(cardLoads.every((item) => item.currentLoad <= 3)).toBe(true);
  });

  it("pulls the next queued attendance after finishing one", async () => {
    const workflow = new InMemoryWorkflow();
    const created = [];

    for (let index = 0; index < 7; index += 1) {
      created.push(
        await workflow.createAttendance({
          customerName: `Cliente ${index}`,
          subject: "Problemas com cartao"
        })
      );
    }

    const queued = created.find(
      (item) => item.data.attendance.status === "QUEUED"
    );
    const inProgress = created.find(
      (item) => item.data.attendance.status === "IN_PROGRESS"
    );

    expect(queued).toBeDefined();
    expect(inProgress).toBeDefined();

    const result = await workflow.finishAttendance(
      inProgress?.data.attendance.id ?? ""
    );

    expect(result.data.result).toBe("FINISHED");
    expect(result.data.assignedAttendance?.id).toBe(
      queued?.data.attendance.id
    );
    expect(result.data.assignedAttendance?.status).toBe("IN_PROGRESS");
  });

  it("does not route new attendances to an offline attendant", async () => {
    const workflow = new InMemoryWorkflow();
    const [offlineAttendant] = (await workflow.getAttendantsLoad()).filter(
      (attendant) => attendant.teamType === "CARDS"
    );

    expect(offlineAttendant).toBeDefined();

    await workflow.updateAttendantStatus(offlineAttendant!.attendantId, {
      isOnline: false
    });
    const created = await workflow.createAttendance({
      customerName: "Cliente Offline",
      subject: "Problemas com cartao"
    });

    expect(created.data.attendance.status).toBe("IN_PROGRESS");
    expect(created.data.attendance.attendantId).not.toBe(
      offlineAttendant!.attendantId
    );
  });

  it("reassigns active attendances when an attendant goes offline", async () => {
    const workflow = new InMemoryWorkflow();
    const created = await workflow.createAttendance({
      customerName: "Cliente Reatribuicao",
      subject: "Problemas com cartao"
    });
    const originalAttendantId = created.data.attendance.attendantId;

    expect(originalAttendantId).toBeTruthy();

    await workflow.updateAttendantStatus(originalAttendantId ?? "", {
      isOnline: false
    });
    const reassigned = await workflow.getAttendance(
      created.data.attendance.id
    );

    expect(reassigned?.status).toBe("IN_PROGRESS");
    expect(reassigned?.attendantId).not.toBe(originalAttendantId);
    expect(reassigned?.attendantId).toBeTruthy();
  });

  it("queues active attendances when no online capacity remains", async () => {
    const workflow = new InMemoryWorkflow();
    const created = [];

    for (let index = 0; index < 6; index += 1) {
      created.push(
        await workflow.createAttendance({
          customerName: `Cliente Capacidade ${index}`,
          subject: "Problemas com cartao"
        })
      );
    }

    const firstCreated = created[0];
    expect(firstCreated).toBeDefined();

    const offlineAttendantId = firstCreated!.data.attendance.attendantId;
    expect(offlineAttendantId).toBeTruthy();

    const affected = created.filter(
      (item) => item.data.attendance.attendantId === offlineAttendantId
    );

    await workflow.updateAttendantStatus(offlineAttendantId ?? "", {
      isOnline: false
    });

    for (const item of affected) {
      const queued = await workflow.getAttendance(item.data.attendance.id);
      expect(queued?.status).toBe("QUEUED");
      expect(queued?.attendantId).toBeNull();
    }

    const summary = await workflow.getSummary();
    expect(summary.inProgress).toBe(3);
    expect(summary.queued).toBe(3);
  });
});
