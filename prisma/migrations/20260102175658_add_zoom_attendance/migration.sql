-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('ONSITE', 'ONLINE');

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "source" "AttendanceSource" NOT NULL DEFAULT 'ONSITE',
ADD COLUMN     "zoomDisplayName" TEXT,
ADD COLUMN     "zoomDurationMin" INTEGER,
ADD COLUMN     "zoomEmail" TEXT,
ADD COLUMN     "zoomJoinTime" TIMESTAMP(3),
ADD COLUMN     "zoomLeaveTime" TIMESTAMP(3);
