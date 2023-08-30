/*
  Warnings:

  - You are about to drop the column `gameInviteToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SensitiveData" ADD COLUMN     "gameInviteToken" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "gameInviteToken";
