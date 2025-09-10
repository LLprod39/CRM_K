-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "materials" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "expectedResults" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_suggestions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
