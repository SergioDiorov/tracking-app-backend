-- DropForeignKey
ALTER TABLE "OrganizationTask" DROP CONSTRAINT "OrganizationTask_assignee_fkey";

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "OrganizationMember"("user") ON DELETE RESTRICT ON UPDATE CASCADE;
