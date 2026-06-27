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
});
