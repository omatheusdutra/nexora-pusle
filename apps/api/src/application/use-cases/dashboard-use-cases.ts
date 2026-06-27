import type { DashboardQueries } from "../contracts";

export class GetDashboardSummaryUseCase {
  constructor(private readonly queries: DashboardQueries) {}

  execute() {
    return this.queries.getSummary();
  }
}

export class GetDashboardQueuesUseCase {
  constructor(private readonly queries: DashboardQueries) {}

  execute() {
    return this.queries.getQueues();
  }
}

export class GetAttendantsLoadUseCase {
  constructor(private readonly queries: DashboardQueries) {}

  execute() {
    return this.queries.getAttendantsLoad();
  }
}

export class GetRecentActivityUseCase {
  constructor(private readonly queries: DashboardQueries) {}

  execute(limit?: number) {
    return this.queries.getRecentActivity(limit);
  }
}
