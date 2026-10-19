import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
    {
        question: "Что такое замыкание (closure) в JavaScript?",
        answer:
            "Замыкание — это функция вместе с окружением, в котором она была создана. Она может обращаться к переменным из внешней области видимости.",
    },
    {
        question: "Что такое Docker?",
        answer:
            "Docker — это платформа для запуска приложений в контейнерах, которые включают приложение и необходимые ему зависимости.",
    },
    {
        question: "Что такое первичный ключ в SQL?",
        answer:
            "Первичный ключ (PRIMARY KEY) — столбец или набор столбцов, однозначно идентифицирующих каждую строку таблицы.",
    },
];

async function seedQuestions(): Promise<void> {
    const questionCount = await prisma.question.count();

    if (questionCount === 0) {
        await prisma.question.createMany({ data: questions });
    }
}

void seedQuestions()
    .catch((error: unknown) => {
        console.error("Не удалось добавить стартовые карточки:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
