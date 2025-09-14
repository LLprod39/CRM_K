/*
  Warnings:

  - Added the required column `teacherId` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
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
INSERT INTO "new_lessons" ("comment", "cost", "createdAt", "date", "endTime", "id", "isCancelled", "isCompleted", "isPaid", "lessonType", "location", "notes", "studentId", "teacherId", "updatedAt") 
SELECT 
  "lessons"."comment", 
  "lessons"."cost", 
  "lessons"."createdAt", 
  "lessons"."date", 
  "lessons"."endTime", 
  "lessons"."id", 
  "lessons"."isCancelled", 
  "lessons"."isCompleted", 
  "lessons"."isPaid", 
  "lessons"."lessonType", 
  "lessons"."location", 
  "lessons"."notes", 
  "lessons"."studentId", 
  COALESCE("students"."userId", 1) as "teacherId", -- Используем userId ученика или админа (id=1) как fallback
  "lessons"."updatedAt" 
FROM "lessons" 
LEFT JOIN "students" ON "lessons"."studentId" = "students"."id";
DROP TABLE "lessons";
ALTER TABLE "new_lessons" RENAME TO "lessons";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
