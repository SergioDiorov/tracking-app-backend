/*
  Warnings:

  - The values [MarketingManager,SalesManager,ProductManager,HRManager,ProjectManager,BusinessAnalyst,ITManager] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Marketing manager', 'Sales manager', 'Product manager', 'HR manager', 'Project manager', 'Business analyst', 'IT manager');
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;
