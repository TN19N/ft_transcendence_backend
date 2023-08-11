/*
  Warnings:

  - You are about to drop the column `achievements` on the `Profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('FIRST_GAME');

-- DropIndex
DROP INDEX "Profile_achievements_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "achievements",
ADD COLUMN     "loses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Achievement" (
    "type" "AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("userId","type")
);

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
