/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('Google', 'Apple', 'Local');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'User', 'Visitor');

-- CreateEnum
CREATE TYPE "StatusReview" AS ENUM ('NeedToReview', 'InReview', 'Reviewed', 'Published', 'Rejected');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('AutomaticCars', 'ManualCars');

-- CreateEnum
CREATE TYPE "LoanOrLeaseStatus" AS ENUM ('No', 'Loan', 'Lease');

-- CreateEnum
CREATE TYPE "PlannedSaleTime" AS ENUM ('In24Hours', 'ThisWeek', 'ThisMonth', 'NotSure');

-- CreateEnum
CREATE TYPE "ExteriorCondition" AS ENUM ('MinorCosmeticDamage', 'ModerateCosmeticDamages', 'CrackedBodywork', 'Rust', 'ChippedOrCrackedGlass', 'NoExteriorDamage');

-- CreateEnum
CREATE TYPE "InteriorDamage" AS ENUM ('NoticeableStains', 'PersistentOdors', 'RipsOrTearsInSeats', 'DamagedDashboardOrInteriorPanels', 'NoInteriorDamage');

-- CreateEnum
CREATE TYPE "TireReplacementTimeframe" AS ENUM ('LessThan12MonthsAgo', 'OverAYearAgo');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('Poor', 'Good', 'Exceptional');

-- CreateEnum
CREATE TYPE "PlannedSaleTimeline" AS ENUM ('Immediately', 'AlmostReady', 'NotReadyYet');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT,
    "phoneNumber" TEXT,
    "otpToken" TEXT,
    "expiredOtpToken" TIMESTAMP(3),
    "refreshToken" TEXT NOT NULL,
    "provider" "Provider" NOT NULL DEFAULT 'Local',
    "avatar" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visitor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "slug" TEXT NOT NULL,
    "vin" TEXT,
    "miliage" INTEGER NOT NULL,
    "statusReview" "StatusReview" NOT NULL,
    "transmission_type" "TransmissionType" NOT NULL,
    "isSoloOwner" BOOLEAN NOT NULL,
    "color" TEXT NOT NULL,
    "loanOrLeaseStatus" "LoanOrLeaseStatus" NOT NULL,
    "isTradeIn" BOOLEAN NOT NULL,
    "plannedSaleTime" "PlannedSaleTime" NOT NULL,
    "additionalFeature" TEXT[],
    "exteriorCondition" "ExteriorCondition" NOT NULL,
    "interiorDamage" "InteriorDamage" NOT NULL,
    "keyCount" INTEGER NOT NULL,
    "tireSetCount" INTEGER NOT NULL,
    "tireReplacementTimeframe" "TireReplacementTimeframe" NOT NULL,
    "hasOriginalFactoryRims" BOOLEAN NOT NULL,
    "hasMechanicalIssues" BOOLEAN NOT NULL,
    "isDriveable" BOOLEAN NOT NULL,
    "hasAccidentOrClaimStatus" BOOLEAN NOT NULL,
    "overallConditionStatus" "ConditionStatus" NOT NULL,
    "plannedSaleTimeline" "PlannedSaleTimeline" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_images" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "userId" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
