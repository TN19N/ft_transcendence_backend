/*
  Warnings:

  - The `avatarType` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "avatarType",
ADD COLUMN     "avatarType" TEXT NOT NULL DEFAULT 'image/jpeg';

-- DropEnum
DROP TYPE "AvatarType";
