/*
  Warnings:

  - You are about to drop the column `achievements` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[achievements]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_achievements_key";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "achievements" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "achievements";

-- CreateIndex
CREATE UNIQUE INDEX "Profile_achievements_key" ON "Profile"("achievements");
