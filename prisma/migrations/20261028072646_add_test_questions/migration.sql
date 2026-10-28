-- CreateTable
CREATE TABLE "test_questions" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_option" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);
