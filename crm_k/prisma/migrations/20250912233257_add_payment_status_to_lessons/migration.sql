-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lessons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "studentId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "comment" TEXT,
    "lessonType" TEXT NOT NULL DEFAULT 'individual',
    "location" TEXT NOT NULL DEFAULT 'office',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lessons" ("comment", "cost", "createdAt", "date", "endTime", "id", "isCancelled", "isCompleted", "isPaid", "lessonType", "location", "notes", "studentId", "teacherId", "updatedAt") SELECT "comment", "cost", "createdAt", "date", "endTime", "id", "isCancelled", "isCompleted", "isPaid", "lessonType", "location", "notes", "studentId", "teacherId", "updatedAt" FROM "lessons";
DROP TABLE "lessons";
ALTER TABLE "new_lessons" RENAME TO "lessons";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
