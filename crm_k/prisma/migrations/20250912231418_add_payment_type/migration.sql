-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'payment',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "date", "description", "id", "studentId", "type", "updatedAt") SELECT "amount", "createdAt", "date", "description", "id", "studentId", coalesce("type", 'payment') AS "type", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
