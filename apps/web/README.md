# Veylo Web

Next.js-приложение, HTTP-адаптеры и браузерные интеграции Veylo. Сценарии и правила находятся в packages/backend, контракт — в packages/contracts.

Из корня репозитория с Node.js 24, pnpm и работающим Docker:

```sh
pnpm install --frozen-lockfile
pnpm local:setup
pnpm dev
```

Откройте http://127.0.0.1:3000/login. Секреты задаются в apps/web/.env.local. Подробнее: [корневой README](../../README.md), [архитектура](../../docs/architecture.md), [деплой](../../docs/runbooks/deployment.md).

Проверки запускаются из корня через pnpm check. E2E требуют запущенный сервер и локальную базу. Голосовые сценарии используют подготовленные WAV. Обновление галереи выполняется только с UPDATE_PREVIEWS=1; обычный тест сохраняет снимки в .local/previews.
