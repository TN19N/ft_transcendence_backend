-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'OFFLINE';
