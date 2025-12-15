/*
  Warnings:

  - You are about to drop the `hiwis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hiwi_sessions" DROP CONSTRAINT "hiwi_sessions_hiwiId_fkey";

-- DropForeignKey
ALTER TABLE "hiwis" DROP CONSTRAINT "hiwis_userId_fkey";

-- DropTable
DROP TABLE "hiwis";

-- CreateTable
CREATE TABLE "HiWi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clothingSize" TEXT,

    CONSTRAINT "HiWi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HiWi_userId_key" ON "HiWi"("userId");

-- AddForeignKey
ALTER TABLE "HiWi" ADD CONSTRAINT "HiWi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiwi_sessions" ADD CONSTRAINT "hiwi_sessions_hiwiId_fkey" FOREIGN KEY ("hiwiId") REFERENCES "HiWi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
