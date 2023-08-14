/*
  Warnings:

  - The values [MESSAGE_1,MESSAGE_10,MESSAGE_100,MESSAGE_GROUP_1,MESSAGE_GROUP_10,MESSAGE_GROUP_100] on the enum `AchievementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AchievementType_new" AS ENUM ('WIN_1', 'WIN_10', 'WIN_100');
ALTER TABLE "Achievement" ALTER COLUMN "type" TYPE "AchievementType_new" USING ("type"::text::"AchievementType_new");
ALTER TYPE "AchievementType" RENAME TO "AchievementType_old";
ALTER TYPE "AchievementType_new" RENAME TO "AchievementType";
DROP TYPE "AchievementType_old";
COMMIT;
