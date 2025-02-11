-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "avatar" DROP NOT NULL;
