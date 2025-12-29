-- CreateTable
CREATE TABLE "staff_announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "sessionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_announcements_eventId_idx" ON "staff_announcements"("eventId");

-- CreateIndex
CREATE INDEX "staff_announcements_sessionId_idx" ON "staff_announcements"("sessionId");

-- AddForeignKey
ALTER TABLE "staff_announcements" ADD CONSTRAINT "staff_announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_announcements" ADD CONSTRAINT "staff_announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_announcements" ADD CONSTRAINT "staff_announcements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
