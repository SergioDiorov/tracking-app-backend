/*
  Warnings:

  - You are about to drop the column `assignee` on the `TaskLog` table. All the data in the column will be lost.
  - Added the required column `assigneeId` to the `TaskLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskLog" DROP CONSTRAINT "TaskLog_assignee_fkey";

-- AlterTable
ALTER TABLE "TaskLog" DROP COLUMN "assignee",
ADD COLUMN     "assigneeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "OrganizationMember"("user") ON DELETE RESTRICT ON UPDATE CASCADE;
