-- CreateTable
CREATE TABLE "BuybackConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "models" TEXT NOT NULL,
    "memories" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
