import {
  resolveSubjectTeamType,
  type TeamType
} from "@flowpay/shared";

export class SubjectRouter {
  resolve(subject: string): TeamType {
    return resolveSubjectTeamType(subject);
  }
}
