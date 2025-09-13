-- CreateTable
CREATE TABLE "daily_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "lessonsPlanned" INTEGER NOT NULL,
    "lessonsHeld" INTEGER NOT NULL,
    "lessonsCanceled" INTEGER NOT NULL,
    "cashOnHand" REAL NOT NULL,
    "totalEarned" REAL NOT NULL,
    "paymentsReceived" REAL NOT NULL,
    "notes" TEXT,
    "issues" TEXT,
    "studentFeedback" TEXT,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "daily_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_date_userId_key" ON "daily_reports"("date", "userId");
