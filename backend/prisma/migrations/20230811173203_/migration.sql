/*
  Warnings:

  - You are about to drop the column `loses` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "loses",
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0;
