-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('TODO', 'BLOCKED', 'INPROGRESS', 'PUSHED', 'DONE');

-- AlterTable
ALTER TABLE "OrganizationTask" ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "loggedTimeSec" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "workStatus" "WorkStatus";
