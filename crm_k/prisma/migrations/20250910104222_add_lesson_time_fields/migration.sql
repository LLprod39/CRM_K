/*
  Warnings:

  - Added the required column `endTime` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lessons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "studentId" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lessonType" TEXT NOT NULL DEFAULT 'individual',
    "location" TEXT NOT NULL DEFAULT 'office',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lessons" ("cost", "createdAt", "date", "id", "isCancelled", "isCompleted", "isPaid", "notes", "studentId", "updatedAt") SELECT "cost", "createdAt", "date", "id", "isCancelled", "isCompleted", "isPaid", "notes", "studentId", "updatedAt" FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new_lessons" RENAME TO "lessons";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
