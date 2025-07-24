-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "OrganizationTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptopn" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "OrganizationMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
