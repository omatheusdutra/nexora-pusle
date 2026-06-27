import { describe, expect, it } from "vitest";
import { DistributionPolicy } from "../src/domain/distribution-policy";
import { SubjectRouter } from "../src/domain/subject-router";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

describe("SubjectRouter", () => {
  it("routes card problems to Cards team", () => {
    expect(new SubjectRouter().resolve("Problemas com cartao")).toBe("CARDS");
    expect(new SubjectRouter().resolve("Problemas com cartão")).toBe("CARDS");
  });

  it("routes loan hiring to Loans team", () => {
    expect(new SubjectRouter().resolve("Contratacao de emprestimo")).toBe(
      "LOANS"
    );
    expect(new SubjectRouter().resolve("Contratação de empréstimo")).toBe(
      "LOANS"
    );
  });

  it("routes other subjects to Other team", () => {
    expect(new SubjectRouter().resolve("Alterar endereco")).toBe("OTHER");
  });
});

describe("DistributionPolicy", () => {
  it("chooses the online attendant with the lowest load", () => {
    const decision = new DistributionPolicy().selectAttendant(
      [
        {
          id: "a",
          name: "A",
          isOnline: true,
          maxConcurrentAttendances: 3,
          createdAt
        },
        {
          id: "b",
          name: "B",
          isOnline: true,
          maxConcurrentAttendances: 3,
          createdAt
        }
      ],
      new Map([
        ["a", 2],
        ["b", 1]
      ]),
      0
    );

    expect(decision?.attendantId).toBe("b");
  });

  it("does not select attendants at full capacity", () => {
    const decision = new DistributionPolicy().selectAttendant(
      [
        {
          id: "a",
          name: "A",
          isOnline: true,
          maxConcurrentAttendances: 3,
          createdAt
        }
      ],
      new Map([["a", 3]]),
      0
    );

    expect(decision).toBeNull();
  });

  it("uses deterministic round-robin when loads tie", () => {
    const attendants = ["a", "b", "c"].map((id) => ({
      id,
      name: id.toUpperCase(),
      isOnline: true,
      maxConcurrentAttendances: 3,
      createdAt
    }));
    const policy = new DistributionPolicy();

    expect(policy.selectAttendant(attendants, new Map(), 0)?.attendantId).toBe(
      "a"
    );
    expect(policy.selectAttendant(attendants, new Map(), 1)?.attendantId).toBe(
      "b"
    );
    expect(policy.selectAttendant(attendants, new Map(), 2)?.attendantId).toBe(
      "c"
    );
  });
});
