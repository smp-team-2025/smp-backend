/*
  Warnings:

  - You are about to alter the column `correctAnswer` on the `fermi_questions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "HiwiAvailabilityStatus" AS ENUM ('AVAILABLE', 'MAYBE', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "fermi_questions" ADD COLUMN     "correctAnswer2" INTEGER,
ALTER COLUMN "correctAnswer" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "hiwi_sessions" ADD COLUMN     "status" "HiwiAvailabilityStatus";
