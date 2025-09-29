-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('pending', 'approved', 'rejected', 'active');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'member');

-- AlterTable
ALTER TABLE "family_members" 
  ALTER COLUMN "role" TYPE "MemberRole" USING "role"::"MemberRole",
  ALTER COLUMN "role" SET DEFAULT 'member',
  ALTER COLUMN "status" TYPE "MemberStatus" USING "status"::"MemberStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending';
