import type { MetricsQueries } from "../contracts";

export class GetOperationalMetricsUseCase {
  constructor(private readonly queries: MetricsQueries) {}

  execute() {
    return this.queries.getOperationalMetrics();
  }
}
