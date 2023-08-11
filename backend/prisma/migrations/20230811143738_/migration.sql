/*
  Warnings:

  - A unique constraint covering the columns `[achievements]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "achievements" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "User_achievements_key" ON "User"("achievements");
