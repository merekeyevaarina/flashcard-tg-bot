
import { PrismaClient } from "@prisma/client";
import { questions } from "../src/lib/questions/seed-data";

const prisma = new PrismaClient();


async function main() {
    for (const item of questions) {
        const existingQuestion = await prisma.question.findFirst({
            where: { question: item.question },
        });

        if (existingQuestion) {
            await prisma.question.update({
                where: { id: existingQuestion.id },
                data: { answer: item.answer },
            });
        } else {
            await prisma.question.create({
                data: {
                    question: item.question,
                    answer: item.answer,
                },
            });
        }
    }

    console.log(`Загружено вопросов: ${questions.length}`);
}

main()
    .catch((error) => {
        console.error("Ошибка при загрузке вопросов:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
