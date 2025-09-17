-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_extractor_config" (
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
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "userPrompt" TEXT NOT NULL DEFAULT '',
    "generationTemperature" REAL NOT NULL DEFAULT 0.2,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 2048,
    "googleGenaiApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_extractor_config" ("auditLogLevel", "autoCommit", "autoCommitMinConf", "consultationMinConf", "createdAt", "extractorModel", "fieldMinConf", "googleGenaiApiKey", "id", "lessonBookingMinConf", "patchMaxAgeSec", "schemaVersion", "studentRegistrationMinConf", "updatedAt", "upsertDedupeWindowSec") SELECT "auditLogLevel", "autoCommit", "autoCommitMinConf", "consultationMinConf", "createdAt", "extractorModel", "fieldMinConf", "googleGenaiApiKey", "id", "lessonBookingMinConf", "patchMaxAgeSec", "schemaVersion", "studentRegistrationMinConf", "updatedAt", "upsertDedupeWindowSec" FROM "extractor_config";
DROP TABLE "extractor_config";
ALTER TABLE "new_extractor_config" RENAME TO "extractor_config";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
