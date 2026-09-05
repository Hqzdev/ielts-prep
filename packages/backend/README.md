# Backend

Серверные сценарии Veylo со слоями Domain, Application, Infrastructure и Composition. HTTP/Next.js здесь отсутствуют. [Архитектура и таблицы](../../docs/architecture.md).

Из корня после установки зависимостей:

```sh
pnpm architecture:check
pnpm exec vitest run packages/backend/tests
pnpm typecheck
```

Application получает порты в конструкторе. Новая интеграция реализуется в infrastructure и подключается в composition. Domain не импортирует SDK, Zod, process.env или веб-пакеты. Межмодульные чтения выполняются через именованные порты; правила записи защищены PostgreSQL RPC и RLS.
