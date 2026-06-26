-- AlterTable
ALTER TABLE "SharedMedia" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "SharedAlbumCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedAlbumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diaryEntryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "DiaryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedAlbumCategory_pairId_idx" ON "SharedAlbumCategory"("pairId");

-- CreateIndex
CREATE INDEX "DiaryComment_diaryEntryId_createdAt_idx" ON "DiaryComment"("diaryEntryId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_deletedAt_idx" ON "Message"("deletedAt");

-- CreateIndex
CREATE INDEX "SharedDiary_pairId_idx" ON "SharedDiary"("pairId");

-- CreateIndex
CREATE INDEX "SharedMedia_uploaderId_idx" ON "SharedMedia"("uploaderId");

-- CreateIndex
CREATE INDEX "SharedMedia_categoryId_idx" ON "SharedMedia"("categoryId");

-- CreateIndex
CREATE INDEX "TimeCapsule_status_idx" ON "TimeCapsule"("status");

-- AddForeignKey
ALTER TABLE "SharedAlbumCategory" ADD CONSTRAINT "SharedAlbumCategory_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "SharedAlbum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedMedia" ADD CONSTRAINT "SharedMedia_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SharedAlbumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryComment" ADD CONSTRAINT "DiaryComment_diaryEntryId_fkey" FOREIGN KEY ("diaryEntryId") REFERENCES "DiaryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryComment" ADD CONSTRAINT "DiaryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
