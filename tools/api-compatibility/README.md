# Swift compatibility

Изолированная проверка общего контракта. Нужны Node.js и Swift 6.1+.

```sh
pnpm swift:check
```

Создаёт временный SwiftPM-пакет в `.local/api-compatibility`, генерирует клиент всего OpenAPI, компилирует и проверяет декодирование ошибок, nullable-ответа и дизайн-данных. Приложение, OAuth-сеанс и вызовы AI не создаются.

Версии прямых зависимостей — `dependencies.json`, всех зависимостей — `Package.resolved`. Для осознанного обновления измените версии и выполните `pnpm swift:resolve`, затем просмотрите lockfile. Формат исходника проверяется `swift format lint --strict tools/api-compatibility/ContractCheck.swift` из корня.
