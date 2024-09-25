/*
  Warnings:

  - The values [MarketingManager,SalesManager,ProductManager,HRManager,ProjectManager,BusinessAnalyst,ITManager] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `email` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workExperienceMonth` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workHours` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workSchedule` to the `OrganizationMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Position" AS ENUM ('MarketingManager', 'SalesManager', 'ProductManager', 'HRManager', 'ProjectManager', 'BusinessAnalyst', 'ITManager');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('Contractor', 'Permanent');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Admin', 'Worker');
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "membersIds" TEXT[];

-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "position" "Position" NOT NULL,
ADD COLUMN     "salary" INTEGER NOT NULL,
ADD COLUMN     "type" "Type" NOT NULL,
ADD COLUMN     "workExperienceMonth" INTEGER NOT NULL,
ADD COLUMN     "workHours" INTEGER NOT NULL,
ADD COLUMN     "workSchedule" TEXT NOT NULL;
