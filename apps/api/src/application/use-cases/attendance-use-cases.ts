import type {
  AttendanceQuery,
  CreateAttendanceInput
} from "@flowpay/shared";
import type {
  AttendanceWorkflow,
  RealtimePublisher
} from "../contracts";
import { publishEvents } from "./publish-events";

export class CreateAttendanceUseCase {
  constructor(
    private readonly workflow: AttendanceWorkflow,
    private readonly realtime: RealtimePublisher
  ) {}

  async execute(input: CreateAttendanceInput) {
    const result = await this.workflow.createAttendance(input);
    await publishEvents(this.realtime, result.events);
    return result.data;
  }
}

export class FinishAttendanceUseCase {
  constructor(
    private readonly workflow: AttendanceWorkflow,
    private readonly realtime: RealtimePublisher
  ) {}

  async execute(id: string) {
    const result = await this.workflow.finishAttendance(id);
    await publishEvents(this.realtime, result.events);
    return result.data;
  }
}

export class CancelAttendanceUseCase {
  constructor(
    private readonly workflow: AttendanceWorkflow,
    private readonly realtime: RealtimePublisher
  ) {}

  async execute(id: string) {
    const result = await this.workflow.cancelAttendance(id);
    await publishEvents(this.realtime, result.events);
    return result.data;
  }
}

export class ListAttendancesUseCase {
  constructor(private readonly workflow: AttendanceWorkflow) {}

  execute(query: AttendanceQuery) {
    return this.workflow.listAttendances(query);
  }
}

export class GetAttendanceUseCase {
  constructor(private readonly workflow: AttendanceWorkflow) {}

  execute(id: string) {
    return this.workflow.getAttendance(id);
  }
}
