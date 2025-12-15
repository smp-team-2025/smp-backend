/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `hiwis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `hiwis` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ORGANIZATOR', 'PARTICIPANT', 'HIWI');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registrationId" INTEGER;

-- AlterTable
ALTER TABLE "hiwis" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationId_key" ON "User"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "hiwis_userId_key" ON "hiwis"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiwis" ADD CONSTRAINT "hiwis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
