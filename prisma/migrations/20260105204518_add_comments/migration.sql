-- CreateTable
CREATE TABLE "announcement_comments" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcement_comments_announcementId_idx" ON "announcement_comments"("announcementId");

-- CreateIndex
CREATE INDEX "announcement_comments_authorId_idx" ON "announcement_comments"("authorId");

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "staff_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_comments" ADD CONSTRAINT "announcement_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
