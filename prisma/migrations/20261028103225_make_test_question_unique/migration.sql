/*
  Warnings:

  - A unique constraint covering the columns `[question]` on the table `test_questions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "test_questions_question_key" ON "test_questions"("question");
