/*
  Warnings:

  - You are about to drop the column `additionalDisclosures` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `additionalFeatures` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `anyAdditionalFeatures` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `hasAccidentOrClaimStatus` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `hasMechanicalIssues` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `hasOriginalFactoryRims` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `isDriveable` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `isSoleOwner` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `isTradeIn` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `keyCount` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `plannedSaleTime` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `tireReplacementTimeframe` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `tireSetCount` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `transmissionType` on the `cars` table. All the data in the column will be lost.
  - Added the required column `higherPrice` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isInvolvedAccidentInsurance` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lowerPrice` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `make` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trim` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Made the column `vin` on table `cars` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "TiresType" ADD VALUE 'SummerTires';

-- DropIndex
DROP INDEX "cars_slug_key";

-- AlterTable
ALTER TABLE "cars" DROP COLUMN "additionalDisclosures",
DROP COLUMN "additionalFeatures",
DROP COLUMN "anyAdditionalFeatures",
DROP COLUMN "color",
DROP COLUMN "hasAccidentOrClaimStatus",
DROP COLUMN "hasMechanicalIssues",
DROP COLUMN "hasOriginalFactoryRims",
DROP COLUMN "isDriveable",
DROP COLUMN "isSoleOwner",
DROP COLUMN "isTradeIn",
DROP COLUMN "keyCount",
DROP COLUMN "plannedSaleTime",
DROP COLUMN "slug",
DROP COLUMN "tireReplacementTimeframe",
DROP COLUMN "tireSetCount",
DROP COLUMN "transmissionType",
ADD COLUMN     "amountClaimed" TEXT,
ADD COLUMN     "anyAftermarketFeatures" TEXT,
ADD COLUMN     "higherPrice" INTEGER NOT NULL,
ADD COLUMN     "isInvolvedAccidentInsurance" BOOLEAN NOT NULL,
ADD COLUMN     "lowerPrice" INTEGER NOT NULL,
ADD COLUMN     "make" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "trim" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "vin" SET NOT NULL;

-- DropEnum
DROP TYPE "AdditionalDisclosures";

-- DropEnum
DROP TYPE "AdditionalFeatures";

-- DropEnum
DROP TYPE "PlannedSaleTime";

-- DropEnum
DROP TYPE "TireReplacementTimeframe";

-- DropEnum
DROP TYPE "TransmissionType";
