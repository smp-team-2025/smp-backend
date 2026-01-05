-- CreateEnum
CREATE TYPE "AnnouncementVisibility" AS ENUM ('ORGA_ONLY', 'HIWI_ORGA', 'PUBLIC');

-- AlterTable
ALTER TABLE "staff_announcements" ADD COLUMN     "visibility" "AnnouncementVisibility" NOT NULL DEFAULT 'HIWI_ORGA';
