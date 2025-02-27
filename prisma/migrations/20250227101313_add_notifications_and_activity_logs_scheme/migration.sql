/*
  Warnings:

  - You are about to drop the column `userId` on the `activity_logs` table. All the data in the column will be lost.
  - Added the required column `actionType` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusReviewLog` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ReviewedSubmission');

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_userId_fkey";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "userId",
ADD COLUMN     "actionType" "ActionType" NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "statusReviewLog" "StatusReview" NOT NULL;

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "seen" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "anyAdditionalFeatures" SET DEFAULT '';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "activityLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_activityLogId_fkey" FOREIGN KEY ("activityLogId") REFERENCES "activity_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
