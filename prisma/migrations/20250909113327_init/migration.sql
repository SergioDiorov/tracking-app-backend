-- CreateEnum
CREATE TYPE "LogWorkPreference" AS ENUM ('REMOTE', 'OFFICE');

-- CreateEnum
CREATE TYPE "LogMood" AS ENUM ('ANGRY', 'FROWN', 'MEH', 'SMILE', 'LAUGH');

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "LogWorkPreference" NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "breakSec" INTEGER,
    "note" TEXT,
    "mood" "LogMood" NOT NULL,
    "assignee" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "OrganizationTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "OrganizationMember"("user") ON DELETE RESTRICT ON UPDATE CASCADE;
