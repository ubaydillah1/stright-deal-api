/*
  Warnings:

  - You are about to drop the column `notes` on the `cars` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vin]` on the table `cars` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `cars` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cars" DROP COLUMN "notes",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cars_vin_key" ON "cars"("vin");
