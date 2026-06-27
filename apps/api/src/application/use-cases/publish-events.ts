import type {
  RealtimePublisher,
  WorkflowEvent
} from "../contracts";

export async function publishEvents(
  realtime: RealtimePublisher,
  events: WorkflowEvent[]
) {
  for (const event of events) {
    await realtime.publish(event);
  }
}
