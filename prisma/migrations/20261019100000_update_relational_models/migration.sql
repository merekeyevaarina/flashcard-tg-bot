-- Rename the existing tables and columns while preserving questions and user progress.
ALTER TABLE "QuestionProgress"
    DROP CONSTRAINT "QuestionProgress_telegramUserId_fkey",
    DROP CONSTRAINT "QuestionProgress_questionId_fkey";

DROP INDEX "QuestionProgress_telegramUserId_status_idx";
DROP INDEX "QuestionProgress_telegramUserId_questionId_key";
DROP INDEX "Question_slug_key";

ALTER TABLE "TelegramUser" RENAME TO "users";
ALTER TABLE "Question" RENAME TO "questions";
ALTER TABLE "QuestionProgress" RENAME TO "user_questions";

ALTER TABLE "users" RENAME COLUMN "telegramId" TO "telegram_id";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" DROP COLUMN "updatedAt";

ALTER TABLE "questions" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "questions" DROP COLUMN "slug";

ALTER TABLE "users" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "users" DROP CONSTRAINT "TelegramUser_pkey";
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

ALTER TABLE "user_questions" ADD COLUMN "user_id" INTEGER;
UPDATE "user_questions" AS progress
SET "user_id" = users."id"
FROM "users" AS users
WHERE users."telegram_id" = progress."telegramUserId";

ALTER TABLE "user_questions" RENAME COLUMN "questionId" TO "question_id";
ALTER TABLE "user_questions" DROP COLUMN "telegramUserId";
ALTER TABLE "user_questions" DROP CONSTRAINT "QuestionProgress_pkey";
ALTER TABLE "user_questions" DROP COLUMN "id";
ALTER TABLE "user_questions" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_questions" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "user_questions" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "user_questions" ADD CONSTRAINT "user_questions_pkey" PRIMARY KEY ("user_id", "question_id");
CREATE INDEX "user_questions_user_id_status_idx" ON "user_questions"("user_id", "status");

ALTER TABLE "questions" RENAME CONSTRAINT "Question_pkey" TO "questions_pkey";
ALTER TABLE "user_questions"
    ADD CONSTRAINT "user_questions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "user_questions_question_id_fkey"
        FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
