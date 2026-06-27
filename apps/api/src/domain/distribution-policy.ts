export interface AssignableAttendant {
  id: string;
  name: string;
  isOnline: boolean;
  maxConcurrentAttendances: number;
  createdAt: Date;
}

export interface DistributionDecision {
  attendantId: string;
  nextCursor: number;
}

export class DistributionPolicy {
  selectAttendant(
    attendants: AssignableAttendant[],
    activeLoads: Map<string, number>,
    roundRobinCursor: number
  ): DistributionDecision | null {
    const available = attendants
      .filter((attendant) => {
        const load = activeLoads.get(attendant.id) ?? 0;
        return attendant.isOnline && load < attendant.maxConcurrentAttendances;
      })
      .sort((a, b) => {
        const loadDiff =
          (activeLoads.get(a.id) ?? 0) - (activeLoads.get(b.id) ?? 0);

        if (loadDiff !== 0) {
          return loadDiff;
        }

        const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();

        if (createdDiff !== 0) {
          return createdDiff;
        }

        return a.id.localeCompare(b.id);
      });

    if (available.length === 0) {
      return null;
    }

    const lowestLoad = activeLoads.get(available[0]?.id ?? "") ?? 0;
    const tied = available.filter(
      (attendant) => (activeLoads.get(attendant.id) ?? 0) === lowestLoad
    );
    const selected = tied[roundRobinCursor % tied.length];

    if (!selected) {
      return null;
    }

    return {
      attendantId: selected.id,
      nextCursor: (roundRobinCursor + 1) % 1_000_000
    };
  }
}
