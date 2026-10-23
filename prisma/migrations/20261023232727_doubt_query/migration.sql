-- CreateTable
CREATE TABLE "DoubtQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "branch" TEXT,
    "subject" TEXT,
    "answer" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoubtQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DoubtQuery_userId_createdAt_idx" ON "DoubtQuery"("userId", "createdAt");
