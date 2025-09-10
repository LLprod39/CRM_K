/*
  Warnings:

  - Added the required column `parentName` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_students" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "parentName" TEXT NOT NULL,
    "diagnosis" TEXT,
    "comment" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_students" ("age", "comment", "createdAt", "diagnosis", "fullName", "id", "phone", "parentName", "updatedAt", "userId") SELECT "age", "comment", "createdAt", "diagnosis", "fullName", "id", "phone", "Не указано", "updatedAt", "userId" FROM "students";
DROP TABLE "students";
ALTER TABLE "new_students" RENAME TO "students";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
