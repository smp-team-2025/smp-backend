-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('STUDENT', 'TEACHER', 'GUEST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "participantType" "ParticipantType";

-- AlterTable
ALTER TABLE "fermi_quizzes" ADD COLUMN     "timerDurationMinutes" INTEGER,
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);
