# Design tokens

Источник цветов, семантических aliases, размеров, шрифтов и ассетов — `src/tokens.json` и `assets`. `src/vey-motion.json` задаёт спокойную позу, состояния Вея и длительности сглаживания. [Решение](../../docs/adr/003-design-data.md).

```sh
pnpm design:generate
pnpm design:check
```

Из корня генератор обновляет CSS и ресурсы приложения по прежним URL. Файлы шрифтов и лицензии сохраняются побайтно.
