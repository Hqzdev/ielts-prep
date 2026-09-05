# Contracts

Единый HTTP-контракт `/api/v1`: Zod-схемы запросов/ответов и реестр операций. `openapi.json` генерируется и коммитится для независимого потребления Swift и другими клиентами.

```sh
pnpm api:generate
pnpm api:check
pnpm swift:check
```

Команды выполняются из корня. Правила ошибок, повторов, потоков и аудио описаны в [ADR 002](../../docs/adr/002-api-and-native-clients.md).
