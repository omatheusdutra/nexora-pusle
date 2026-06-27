import type {
  RealtimePublisher,
  WorkflowEvent
} from "../../application/contracts";

export class NoopRealtimePublisher implements RealtimePublisher {
  publish(_event: WorkflowEvent) {
    return undefined;
  }
}
