CREATE TYPE "TeamType" AS ENUM ('CARDS', 'LOANS', 'OTHER');

CREATE TYPE "AttendanceStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "TeamType" NOT NULL,
  "subjectMatcher" TEXT NOT NULL,
  "roundRobinCursor" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "isOnline" BOOLEAN NOT NULL DEFAULT true,
  "maxConcurrentAttendances" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendance" (
  "id" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "teamId" TEXT NOT NULL,
  "attendantId" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_type_key" ON "Team"("type");
CREATE INDEX "Team_type_idx" ON "Team"("type");
CREATE UNIQUE INDEX "Attendant_teamId_name_key" ON "Attendant"("teamId", "name");
CREATE INDEX "Attendant_teamId_isOnline_idx" ON "Attendant"("teamId", "isOnline");
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");
CREATE INDEX "Attendance_teamId_status_queuedAt_idx" ON "Attendance"("teamId", "status", "queuedAt");
CREATE INDEX "Attendance_attendantId_status_idx" ON "Attendance"("attendantId", "status");

ALTER TABLE "Attendant"
  ADD CONSTRAINT "Attendant_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_attendantId_fkey"
  FOREIGN KEY ("attendantId") REFERENCES "Attendant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
