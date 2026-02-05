/*
  Warnings:

  - Made the column `eventId` on table `Registration` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_eventId_fkey";

-- AlterTable
ALTER TABLE "Registration" ALTER COLUMN "eventId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
