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
CREATE TYPE "AdditionalFeatures" AS ENUM ('AftermarketRims', 'CosmeticModifications', 'AftermarketColoredWrap', 'AftermarketSuspension', 'AftermarketExhaust', 'AftermarketStereo', 'AftermarketPerformanceUpgrades');

-- CreateEnum
CREATE TYPE "InteriorDamage" AS ENUM ('NoticeableStains', 'PersistentOdors', 'RipsOrTearsInSeats', 'DamagedDashboardOrInteriorPanels', 'NoInteriorDamage');

-- CreateEnum
CREATE TYPE "TireReplacementTimeframe" AS ENUM ('LessThan12MonthsAgo', 'OverAYearAgo');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('Poor', 'Good', 'Exceptional');

-- CreateEnum
CREATE TYPE "PlannedSaleTimeline" AS ENUM ('Immediately', 'AlmostReady', 'NotReadyYet');

-- CreateEnum
CREATE TYPE "AdditionalDisclosures" AS ENUM ('RipsOrTearsInSeats', 'FireOrFloodDamage', 'PreviouslyStolen', 'NoNothingElseToDisclose');

-- CreateEnum
CREATE TYPE "TiresType" AS ENUM ('AllSeason', 'WinterTires');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationTokenExpiry" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneOtpToken" TEXT,
    "expiredPhoneOtpToken" TIMESTAMP(3),
    "refreshToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "provider" "Provider" NOT NULL DEFAULT 'Local',
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Visitor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT,
    "vin" TEXT,
    "miliage" INTEGER NOT NULL,
    "statusReview" "StatusReview" NOT NULL DEFAULT 'NeedToReview',
    "transmissionType" "TransmissionType" NOT NULL,
    "isSoleOwner" BOOLEAN NOT NULL,
    "color" TEXT NOT NULL,
    "loanOrLeaseStatus" "LoanOrLeaseStatus" NOT NULL,
    "loanCompany" TEXT,
    "remainingBalance" INTEGER,
    "monthlyPayment" INTEGER,
    "monthsRemaining" INTEGER,
    "purchaseOptionAmount" INTEGER,
    "isTradeIn" BOOLEAN NOT NULL,
    "plannedSaleTime" "PlannedSaleTime" NOT NULL,
    "additionalFeatures" "AdditionalFeatures"[],
    "anyAdditionalFeatures" TEXT NOT NULL,
    "exteriorCondition" "ExteriorCondition"[],
    "interiorDamage" "InteriorDamage"[],
    "additionalDisclosures" "AdditionalDisclosures" NOT NULL DEFAULT 'NoNothingElseToDisclose',
    "keyCount" INTEGER NOT NULL,
    "tireSetCount" INTEGER NOT NULL,
    "tireReplacementTimeframe" "TireReplacementTimeframe" NOT NULL,
    "tiresType" "TiresType" NOT NULL,
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
    "carId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneOtpToken_key" ON "users"("phoneOtpToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_refreshToken_key" ON "users"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cars_slug_key" ON "cars"("slug");

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
