-- CreateEnum
CREATE TYPE "AvatarType" AS ENUM ('PNG', 'JPG');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarType" "AvatarType" NOT NULL DEFAULT 'JPG';
