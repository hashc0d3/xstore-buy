-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BuybackConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "models" TEXT NOT NULL,
    "memories" TEXT NOT NULL,
    "simTypes" TEXT NOT NULL DEFAULT 'eSIM|nano-SIM|eSIM + nano-SIM',
    "conditions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BuybackConfig" ("conditions", "createdAt", "id", "memories", "models", "updatedAt")
SELECT "conditions", "createdAt", "id", "memories", "models", "updatedAt" FROM "BuybackConfig";
DROP TABLE "BuybackConfig";
ALTER TABLE "new_BuybackConfig" RENAME TO "BuybackConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
