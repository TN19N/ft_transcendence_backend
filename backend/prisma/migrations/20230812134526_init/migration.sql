/*
  Warnings:

  - You are about to drop the column `intra42Id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[intra42Id]` on the table `SensitiveData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `SensitiveData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_intra42Id_key";

-- AlterTable
ALTER TABLE "SensitiveData" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "intra42Id" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "intra42Id";

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveData_intra42Id_key" ON "SensitiveData"("intra42Id");

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveData_googleId_key" ON "SensitiveData"("googleId");
