-- CreateTable
CREATE TABLE "OfficialPaper" (
    "id" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "setLabel" TEXT,
    "institute" TEXT,
    "note" TEXT,
    "pdfPath" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "numbering" TEXT NOT NULL DEFAULT 'sections',
    "keyStatus" TEXT NOT NULL DEFAULT 'none',
    "source" TEXT NOT NULL,

    CONSTRAINT "OfficialPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialQuestion" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,

    CONSTRAINT "OfficialQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "correct" INTEGER NOT NULL,
    "wrong" INTEGER NOT NULL,
    "unanswered" INTEGER NOT NULL,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficialPaper_branchCode_year_idx" ON "OfficialPaper"("branchCode", "year");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialQuestion_paperId_section_number_key" ON "OfficialQuestion"("paperId", "section", "number");

-- CreateIndex
CREATE INDEX "PaperAttempt_userId_createdAt_idx" ON "PaperAttempt"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "OfficialQuestion" ADD CONSTRAINT "OfficialQuestion_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "OfficialPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperAttempt" ADD CONSTRAINT "PaperAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperAttempt" ADD CONSTRAINT "PaperAttempt_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "OfficialPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
