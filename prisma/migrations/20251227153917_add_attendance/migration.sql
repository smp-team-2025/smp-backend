-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "scannedByHiwiId" INTEGER,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendances_sessionId_idx" ON "attendances"("sessionId");

-- CreateIndex
CREATE INDEX "attendances_participantId_idx" ON "attendances"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_participantId_sessionId_key" ON "attendances"("participantId", "sessionId");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_scannedByHiwiId_fkey" FOREIGN KEY ("scannedByHiwiId") REFERENCES "HiWi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
