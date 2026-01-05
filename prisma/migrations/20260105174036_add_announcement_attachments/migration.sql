/*
  Warnings:

  - You are about to drop the column `answer` on the `fermi_responses` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `fermi_responses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[participantId,quizId]` on the table `fermi_responses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `answers` to the `fermi_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizId` to the `fermi_responses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "fermi_responses" DROP CONSTRAINT "fermi_responses_sessionId_fkey";

-- DropIndex
DROP INDEX "fermi_responses_participantId_sessionId_key";

-- DropIndex
DROP INDEX "fermi_responses_sessionId_idx";

-- AlterTable
ALTER TABLE "fermi_responses" DROP COLUMN "answer",
DROP COLUMN "sessionId",
ADD COLUMN     "answers" JSONB NOT NULL,
ADD COLUMN     "quizId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "announcement_attachments" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fermi_questions" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "correctAnswer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fermi_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fermi_quizzes" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fermi_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fermi_quiz_questions" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "fermi_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcement_attachments_announcementId_idx" ON "announcement_attachments"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "fermi_quizzes_sessionId_key" ON "fermi_quizzes"("sessionId");

-- CreateIndex
CREATE INDEX "fermi_quiz_questions_quizId_idx" ON "fermi_quiz_questions"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "fermi_quiz_questions_quizId_order_key" ON "fermi_quiz_questions"("quizId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "fermi_quiz_questions_quizId_questionId_key" ON "fermi_quiz_questions"("quizId", "questionId");

-- CreateIndex
CREATE INDEX "fermi_responses_quizId_idx" ON "fermi_responses"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "fermi_responses_participantId_quizId_key" ON "fermi_responses"("participantId", "quizId");

-- AddForeignKey
ALTER TABLE "announcement_attachments" ADD CONSTRAINT "announcement_attachments_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "staff_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fermi_quizzes" ADD CONSTRAINT "fermi_quizzes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fermi_quiz_questions" ADD CONSTRAINT "fermi_quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "fermi_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fermi_quiz_questions" ADD CONSTRAINT "fermi_quiz_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "fermi_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fermi_responses" ADD CONSTRAINT "fermi_responses_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "fermi_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
