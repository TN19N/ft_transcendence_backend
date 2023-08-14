-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_1';
ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_10';
ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_100';
ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_GROUP_1';
ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_GROUP_10';
ALTER TYPE "AchievementType" ADD VALUE 'MESSAGE_GROUP_100';
