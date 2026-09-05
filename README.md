# Veylo

Рабочая среда для подготовки к IELTS Academic: задания, черновики, Reading, Speaking, разговор с Веем, словарь, Arcade и ежедневные огоньки.

Монорепозиторий со слоистой архитектурой. Бизнес-правила и сценарии работают независимо от Next.js. Веб — первое приложение; будущие iOS и macOS будут использовать тот же версионированный API.

## Локальный запуск

Нужны Node.js из `.node-version`, pnpm из `package.json` и работающий Docker Desktop либо OrbStack. Команды выполняются из корня репозитория:

```sh
pnpm install --frozen-lockfile
pnpm local:setup
pnpm dev
```

Откройте [Veylo](http://127.0.0.1:3000/login) и выберите **Open local account**. Быстрый вход существует только в development с локальным Supabase. Setup сохраняет существующие настройки, применяет миграции и импортирует учебный банк без дубликатов. Секреты находятся в `apps/web/.env.local`, в Git они не попадают.

Google использует `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в окружении Supabase. Существующая локальная настройка сохранена. Для новой OAuth-конфигурации нужны реальные credentials и разрешённые callback URL. Для обычного локального входа Google не требуется.

## Структура

| Путь                      | Назначение                                                           |
| ------------------------- | -------------------------------------------------------------------- |
| `apps/web`                | Next.js, страницы, HTTP-адаптеры, Auth, браузерное аудио и IndexedDB |
| `packages/backend`        | Domain, Application, Infrastructure, Composition                     |
| `packages/contracts`      | Zod-контракты и OpenAPI 3.1 для `/api/v1`                            |
| `packages/api-client`     | Сгенерированные TypeScript-типы и HTTP-клиент                        |
| `packages/design-tokens`  | Цвета, типографика, ассеты и позы Вея                                |
| `packages/ui-web`         | SVG-Вей, контроллеры движения и общие веб-модели интерфейса          |
| `tools/content-generator` | Отдельный Python-генератор учебных материалов                        |
| `tools/api-compatibility` | Проверка генерации и компиляции Swift-клиента                        |
| `infra/supabase`          | Конфигурация, SQL-миграции и транзакционные проверки                 |

## Стек

TypeScript 5.9, Node.js 24, pnpm 11, Next.js 16 App Router, React 19, Tailwind CSS 4 и обычный CSS. Интерфейс использует Radix UI, Phosphor/Lucide, Recharts и React Flow. База — PostgreSQL через Supabase; вход — Supabase Auth; аудио — закрытый Supabase Storage. AI — Google Gemini через серверный адаптер. Фоновое оценивание — Workflow. Браузерные механизмы: Web Audio, VAD/ONNX, WAV PCM и IndexedDB.

Контракты: Zod 4 → OpenAPI 3.1 → `openapi-typescript` и `openapi-fetch`. Проверки: Vitest, Playwright, SQL, TypeScript, ESLint, Prettier и проверка архитектурных импортов. Python 3.13 использует uv, Pydantic, google-genai, Black и Ruff с `uv.lock`. Совместимость Apple проверяется официальными Swift OpenAPI Generator, Runtime и URLSession; зависимости закреплены в `Package.resolved`.

Будущие приложения: Swift, SwiftUI, SwiftPM, URLSession, Keychain и AVFoundation. Пользовательские приложения iOS/macOS на этом этапе не создаются.

## Проверки

```sh
pnpm check
pnpm test:sql
pnpm test:integration
pnpm test:e2e
```

Последние три команды требуют локальную базу; integration и E2E — также запущенное приложение. Для браузеров один раз выполните `pnpm exec playwright install chromium chrome webkit`. Голосовые тесты используют подготовленные аудиофайлы, не физический микрофон.

Для Python установите uv и выполните `uv sync --project tools/content-generator --frozen`, затем `pnpm python:check`. Для Swift нужен Swift 6.1+; команда — `pnpm swift:check`. Проверка Swift создаёт временный пакет в игнорируемой `.local/`, без приложения и без запросов к AI.

После изменения API: `pnpm api:generate`. После изменения дизайн-данных: `pnpm design:generate`. CI проверяет, что сгенерированные файлы актуальны. Pre-commit проверяет формат, слои, контракт, типы и линтеры; commit-msg проверяет Conventional Commits.

## AI и эксплуатация

В `apps/web/.env.local` задаётся `GEMINI_API_KEY`; ключ доступен только серверу. Без него сохраняются работы и записи, работают Reading, словарь и серия. Writing/Speaking-оценивание дополнительно закрыто флагами до экспертной калибровки. Изменение архитектуры не включает оценивание автоматически.

- [Архитектура и границы](docs/architecture.md)
- [API и будущие Apple-клиенты](docs/adr/002-api-and-native-clients.md)
- [Правила разработки и владение](docs/contributing.md)
- [Деплой и откат](docs/runbooks/deployment.md)
- [Резервное копирование](docs/runbooks/recovery.md)
- [Логи и диагностика](docs/runbooks/observability.md)
- [Качество оценивания](docs/assessment-quality.md)
- [Результат миграции](docs/migration-report.md)

CODEOWNERS назначен владельцу существующего origin — @Hqzdev. Branch protection, второй ревьюер и реальные staging/production-проекты ещё требуют настройки. Наличие workflow-файлов не означает, что удалённые проверки или deployment уже выполнялись.
