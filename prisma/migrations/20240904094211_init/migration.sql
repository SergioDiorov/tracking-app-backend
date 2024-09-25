-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('IT', 'Engineering', 'Entertainment', 'Management', 'Other');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "Industry" NOT NULL,
    "registrationCountry" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "corporateEmail" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT NOT NULL,
    "members" TEXT[],
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_ownerId_key" ON "Organization"("ownerId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
