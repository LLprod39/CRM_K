-- CreateTable
CREATE TABLE "notification_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderBeforeLessons" INTEGER NOT NULL DEFAULT 60,
    "dailySummaryTime" TEXT,
    "isDailySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isWeeklySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklySummaryDay" INTEGER NOT NULL DEFAULT 0,
    "weeklySummaryTime" TEXT,
    "reminderTemplate" TEXT,
    "summaryTemplate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledTime" DATETIME NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "errorMessage" TEXT,
    "notificationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scheduled_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scheduled_notifications_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");
