# API client

Сгенерированные типы paths/operations и клиент на openapi-fetch. `createVeyloClient` принимает baseUrl, источник актуального access token и fetch. `ApiError` содержит code, status и requestId. Записи автоматически не повторяются.

```sh
pnpm api:generate
pnpm exec vitest run packages/api-client/tests
```

Команды выполняются из корня. `src/schema.ts` вручную не редактируется. Веб передаёт свою обработку успешной учебной активности, поэтому SDK не зависит от DOM или React.
