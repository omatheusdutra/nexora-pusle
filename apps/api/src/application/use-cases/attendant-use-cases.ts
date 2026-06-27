import type {
  CreateAttendantInput,
  UpdateAttendantStatusInput
} from "@flowpay/shared";
import type {
  AttendantWorkflow,
  RealtimePublisher
} from "../contracts";
import { publishEvents } from "./publish-events";

export class ListAttendantsUseCase {
  constructor(private readonly workflow: AttendantWorkflow) {}

  execute() {
    return this.workflow.listAttendants();
  }
}

export class CreateAttendantUseCase {
  constructor(
    private readonly workflow: AttendantWorkflow,
    private readonly realtime: RealtimePublisher
  ) {}

  async execute(input: CreateAttendantInput) {
    const result = await this.workflow.createAttendant(input);
    await publishEvents(this.realtime, result.events);
    return result.data;
  }
}

export class UpdateAttendantStatusUseCase {
  constructor(
    private readonly workflow: AttendantWorkflow,
    private readonly realtime: RealtimePublisher
  ) {}

  async execute(id: string, input: UpdateAttendantStatusInput) {
    const result = await this.workflow.updateAttendantStatus(id, input);
    await publishEvents(this.realtime, result.events);
    return result.data;
  }
}
