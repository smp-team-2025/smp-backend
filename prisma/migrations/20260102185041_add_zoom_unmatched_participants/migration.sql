-- CreateTable
CREATE TABLE "zoom_unmatched_participants" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "durationMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zoom_unmatched_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zoom_unmatched_participants_sessionId_idx" ON "zoom_unmatched_participants"("sessionId");

-- AddForeignKey
ALTER TABLE "zoom_unmatched_participants" ADD CONSTRAINT "zoom_unmatched_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
