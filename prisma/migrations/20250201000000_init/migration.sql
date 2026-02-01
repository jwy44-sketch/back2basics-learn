-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "choices" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "farRefs" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "proficiency" REAL NOT NULL DEFAULT 0.2,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lastAnsweredAt" DATETIME,
    "nextDueAt" DATETIME,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "selectedIndex" INTEGER NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL,
    "mode" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Question_session_idx" ON "Question"("session");
-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");
-- CreateIndex
CREATE UNIQUE INDEX "Progress_questionId_key" ON "Progress"("questionId");
-- CreateIndex
CREATE INDEX "Progress_nextDueAt_idx" ON "Progress"("nextDueAt");
-- CreateIndex
CREATE INDEX "Progress_proficiency_idx" ON "Progress"("proficiency");
-- CreateIndex
CREATE INDEX "Progress_isBookmarked_idx" ON "Progress"("isBookmarked");
-- CreateIndex
CREATE INDEX "Attempt_questionId_idx" ON "Attempt"("questionId");
-- CreateIndex
CREATE INDEX "Attempt_topic_idx" ON "Attempt"("topic");
-- CreateIndex
CREATE INDEX "Attempt_mode_idx" ON "Attempt"("mode");
