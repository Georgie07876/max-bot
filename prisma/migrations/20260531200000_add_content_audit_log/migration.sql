-- CreateTable
CREATE TABLE "ContentAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "oldText" TEXT NOT NULL,
    "newText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ContentAuditLog_blockId_idx" ON "ContentAuditLog"("blockId");

-- CreateIndex
CREATE INDEX "ContentAuditLog_createdAt_idx" ON "ContentAuditLog"("createdAt");
