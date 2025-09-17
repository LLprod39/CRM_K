-- CreateTable
CREATE TABLE "extractor_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0,
    "conversationId" TEXT NOT NULL,
    "draftId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdBy" TEXT,
    "acknowledgedBy" TEXT,
    "resolvedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "extractor_notifications_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "conversation_drafts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversation_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "draftData" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "autoCommit" BOOLEAN NOT NULL DEFAULT false,
    "isCommitted" BOOLEAN NOT NULL DEFAULT false,
    "committedAt" DATETIME,
    "committedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_conversation_drafts" ("autoCommit", "conversationId", "createdAt", "draftData", "formType", "id", "isComplete", "updatedAt") SELECT "autoCommit", "conversationId", "createdAt", "draftData", "formType", "id", "isComplete", "updatedAt" FROM "conversation_drafts";
DROP TABLE "conversation_drafts";
ALTER TABLE "new_conversation_drafts" RENAME TO "conversation_drafts";
CREATE UNIQUE INDEX "conversation_drafts_conversationId_key" ON "conversation_drafts"("conversationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "extractor_notifications_conversationId_idx" ON "extractor_notifications"("conversationId");

-- CreateIndex
CREATE INDEX "extractor_notifications_status_idx" ON "extractor_notifications"("status");

-- CreateIndex
CREATE INDEX "extractor_notifications_type_idx" ON "extractor_notifications"("type");

-- CreateIndex
CREATE INDEX "extractor_notifications_createdAt_idx" ON "extractor_notifications"("createdAt");
