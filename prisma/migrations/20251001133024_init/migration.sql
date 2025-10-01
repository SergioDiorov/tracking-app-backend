-- DropForeignKey
ALTER TABLE "OrganizationTask" DROP CONSTRAINT "OrganizationTask_assignee_fkey";

-- AlterTable
ALTER TABLE "OrganizationTask" ALTER COLUMN "assignee" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "OrganizationMember"("user") ON DELETE SET NULL ON UPDATE CASCADE;
