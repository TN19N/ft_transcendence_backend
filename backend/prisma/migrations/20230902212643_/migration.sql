/*
  Warnings:

  - You are about to drop the column `signUp` on the `SensitiveData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SensitiveData" DROP COLUMN "signUp",
ADD COLUMN     "signup" BOOLEAN NOT NULL DEFAULT true;
