/*
  Warnings:

  - You are about to drop the column `signup` on the `SensitiveData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SensitiveData" DROP COLUMN "signup";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signup" BOOLEAN NOT NULL DEFAULT true;
