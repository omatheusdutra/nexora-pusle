import type { AuditEventQuery } from "@flowpay/shared";
import type { AuditQueries } from "../contracts";

export class ListAuditEventsUseCase {
  constructor(private readonly queries: AuditQueries) {}

  execute(query: AuditEventQuery) {
    return this.queries.listAuditEvents(query);
  }
}
