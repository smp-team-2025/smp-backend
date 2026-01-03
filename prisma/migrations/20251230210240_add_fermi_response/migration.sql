-- CreateTable
CREATE TABLE "fermi_responses" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "answer" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fermi_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fermi_responses_sessionId_idx" ON "fermi_responses"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "fermi_responses_participantId_sessionId_key" ON "fermi_responses"("participantId", "sessionId");

-- AddForeignKey
ALTER TABLE "fermi_responses" ADD CONSTRAINT "fermi_responses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fermi_responses" ADD CONSTRAINT "fermi_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
