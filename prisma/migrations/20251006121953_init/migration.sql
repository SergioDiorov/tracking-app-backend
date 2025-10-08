-- DropForeignKey
ALTER TABLE "TaskLog" DROP CONSTRAINT "TaskLog_assigneeId_fkey";

-- AlterTable
ALTER TABLE "TaskLog" ALTER COLUMN "assigneeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "OrganizationMember"("user") ON DELETE SET NULL ON UPDATE CASCADE;
