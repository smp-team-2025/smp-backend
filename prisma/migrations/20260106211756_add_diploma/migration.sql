-- CreateTable
CREATE TABLE "diplomas" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diplomas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_certificateNumber_key" ON "diplomas"("certificateNumber");

-- CreateIndex
CREATE INDEX "diplomas_eventId_idx" ON "diplomas"("eventId");

-- CreateIndex
CREATE INDEX "diplomas_participantId_idx" ON "diplomas"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_participantId_eventId_key" ON "diplomas"("participantId", "eventId");

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
