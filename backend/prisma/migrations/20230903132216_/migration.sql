/*
  Warnings:

  - You are about to drop the column `signup` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SensitiveData" ADD COLUMN     "signup" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "signup";
