
import { prisma } from "../db/prisma";

export async function getRandomTestQuestions(count = 20) {
    const questions = await prisma.testQuestion.findMany({
        select: {
            id: true,
            question: true,
            options: true,
            correctOption: true,
        },
    });

    const shuffled = [...questions];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
}
