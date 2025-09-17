-- CreateTable
CREATE TABLE "conversation_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "draftData" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "autoCommit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "draft_versions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "draftId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "patchData" JSONB NOT NULL,
    "confidence" REAL NOT NULL,
    "messageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "draft_versions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "conversation_drafts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "draft_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "submissionData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "draft_submissions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "conversation_drafts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "conversation_drafts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extractor_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "draftId" TEXT,
    "messageId" TEXT,
    "operation" TEXT NOT NULL,
    "inputData" JSONB,
    "outputData" JSONB,
    "confidence" REAL,
    "errorMessage" TEXT,
    "processingTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "extractor_logs_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "conversation_drafts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_drafts_conversationId_key" ON "conversation_drafts"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_versions_draftId_version_key" ON "draft_versions"("draftId", "version");
