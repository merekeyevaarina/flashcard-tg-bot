import { PrismaClient } from "@prisma/client";
import { questions } from "./src/lib/questions/seed-data";

const prisma = new PrismaClient();

async function main() {
    await prisma.question.createMany({
        data: questions,
        skipDuplicates: true,
    });

    console.log("Вопросы загружены!");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });