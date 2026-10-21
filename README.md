# Flashcard Telegram Bot

Telegram-бот показывает вопросы и ответы из PostgreSQL и сохраняет прогресс пользователей. Обновления Telegram приходят на webhook через HTTP-сервер приложения; long polling не используется.

## Деплой на Render

Приложение разворачивается как **Web Service**. Render выдаёт ему HTTPS-адрес, а приложение автоматически сообщает этот адрес Telegram и слушает порт из переменной `PORT`.

В проекте есть `render.yaml` для Render Blueprint. В нём настроен бесплатный Web Service с проверкой `/health`. Переменные окружения:

- `TELEGRAM_BOT_TOKEN` — токен нужного бота из BotFather.
- `DATABASE_URL` — строка подключения к PostgreSQL, используемая Prisma.
- `WEBHOOK_SECRET` — секрет для проверки запросов Telegram. Blueprint генерирует его автоматически. Если сервис уже создан вручную, добавьте эту переменную в разделе **Environment**; подойдёт случайная строка, например результат `openssl rand -hex 32`.

### Если Web Service уже создан

Оставьте существующий **Web Service** и подключённый GitHub-репозиторий. Не создавайте Background Worker. Отправьте изменения в подключённую ветку, затем в Render откройте этот сервис и проверьте:

1. **Build Command:** `npm ci && npm run build`
2. **Start Command:** `npm start`
3. В **Environment** заданы `TELEGRAM_BOT_TOKEN`, `DATABASE_URL` и `WEBHOOK_SECRET`.
4. В настройках сервиса указан путь проверки здоровья `/health` (если Render предлагает это поле).
5. Для бесплатного запуска выберите план **Free**.

После успешного деплоя Render покажет адрес вида `https://имя-сервиса.onrender.com`. Приложение берёт URL из `RENDER_EXTERNAL_URL`; вручную вставлять его в код или задавать отдельную переменную на Render не нужно. В логах должна появиться строка `запущен через webhook`.

Код отвечает `200 OK` на `GET /health` для проверки Render и принимает обновления Telegram на `POST /telegram/webhook`. При старте приложения адрес webhook регистрируется через Telegram Bot API.

## Локальный запуск

Webhook требует публичный HTTPS-адрес. Для локального запуска создайте `.env` на основе `.env.example` и укажите:

- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- `WEBHOOK_SECRET`
- `WEBHOOK_URL` — публичный HTTPS-адрес туннеля на ваш компьютер

Затем выполните `npm ci`, `npm run db:generate` и `npm start`. Одновременно запускать этот webhook и экземпляр того же бота через long polling нельзя.

## Основные команды

- `npm run build` — сгенерировать Prisma Client.
- `npm run db:deploy` — применить миграции и загрузить начальные карточки.
- `npm run db:migrate` — создать/применить миграции в локальной разработке.
- `npm run db:studio` — открыть Prisma Studio.
