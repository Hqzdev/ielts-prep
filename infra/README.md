# Infrastructure

`supabase/config.toml` сохраняет project_id `ielts-prep`. SQL-миграции применяются последовательно; существующие применённые файлы не редактируются.

Из корня с работающим Docker:

```sh
pnpm local:setup
pnpm test:sql
```

Для уже запущенной базы новые миграции применяет `pnpm db:migrate`. SQL-тесты откатывают собственные данные. Секреты OAuth передаются окружением либо игнорируемым `infra/.env`. Локальная связка с `apps/web/.env.local` сохранена.

Vercel Cron описан в `apps/web/vercel.json`. Реальные cloud resources ещё требуют назначения провайдера/проектов. См. [deployment](../docs/runbooks/deployment.md), [recovery](../docs/runbooks/recovery.md) и [observability](../docs/runbooks/observability.md).
