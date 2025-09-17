-- CreateTable
CREATE TABLE "extractor_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "extractorModel" TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
    "autoCommit" BOOLEAN NOT NULL DEFAULT false,
    "autoCommitMinConf" REAL NOT NULL DEFAULT 0.85,
    "fieldMinConf" REAL NOT NULL DEFAULT 0.75,
    "patchMaxAgeSec" INTEGER NOT NULL DEFAULT 3600,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
    "upsertDedupeWindowSec" INTEGER NOT NULL DEFAULT 300,
    "auditLogLevel" TEXT NOT NULL DEFAULT 'info',
    "lessonBookingMinConf" REAL NOT NULL DEFAULT 0.8,
    "studentRegistrationMinConf" REAL NOT NULL DEFAULT 0.9,
    "consultationMinConf" REAL NOT NULL DEFAULT 0.7,
    "googleGenaiApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
