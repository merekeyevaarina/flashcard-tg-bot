-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('LIKED', 'REVIEW');

-- CreateTable
CREATE TABLE "TelegramUser" (
    "telegramId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("telegramId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionProgress" (
    "id" SERIAL NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "status" "ProgressStatus" NOT NULL,

    CONSTRAINT "QuestionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE INDEX "QuestionProgress_telegramUserId_status_idx" ON "QuestionProgress"("telegramUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionProgress_telegramUserId_questionId_key" ON "QuestionProgress"("telegramUserId", "questionId");

-- AddForeignKey
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "QuestionProgress_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("telegramId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "QuestionProgress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

