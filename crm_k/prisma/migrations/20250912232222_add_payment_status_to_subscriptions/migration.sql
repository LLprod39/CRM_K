-- CreateTable
CREATE TABLE "flexible_subscription_paid_days" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "dayId" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flexible_subscription_paid_days_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "flexible_subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flexible_subscription_paid_days_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "flexible_subscription_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_flexible_subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalCost" REAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flexible_subscriptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flexible_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_flexible_subscriptions" ("createdAt", "description", "endDate", "id", "isPaid", "name", "startDate", "studentId", "totalCost", "updatedAt", "userId") SELECT "createdAt", "description", "endDate", "id", "isPaid", "name", "startDate", "studentId", "totalCost", "updatedAt", "userId" FROM "flexible_subscriptions";
DROP TABLE "flexible_subscriptions";
ALTER TABLE "new_flexible_subscriptions" RENAME TO "flexible_subscriptions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "flexible_subscription_paid_days_subscriptionId_dayId_key" ON "flexible_subscription_paid_days"("subscriptionId", "dayId");
