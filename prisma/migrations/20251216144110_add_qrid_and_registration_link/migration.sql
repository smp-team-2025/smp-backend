/*
  Warnings:

  - A unique constraint covering the columns `[qrId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "qrId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_qrId_key" ON "User"("qrId");
