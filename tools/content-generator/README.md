# Content generator

Самостоятельный Python-инструмент, не часть runtime веба. Нужен uv; Python 3.13 устанавливается автоматически. Из корня репозитория:

```sh
uv sync --project tools/content-generator --frozen
pnpm python:check
uv run --project tools/content-generator --frozen python tools/content-generator/generate_tasks.py --help
```

Генерация требует `GEMINI_API_KEY` в переменной окружения либо в локальном `tools/content-generator/.env`. После настройки запускайте тот же CLI с `--task writing_task2 --count 5`. Реальная генерация обращается к Gemini и может расходовать квоту. Обычные проверки не обращаются к AI.

Материалы сохраняются атомарно в `tasks.json` рядом с инструментом. Каталог `practice_tasks` — сохранённый авторский банк, `TASK_FORMATS.md` описывает форматы. Вывод генератора нужно проверить и импортировать через контракт ContentEntry; runtime веба не читает произвольный tasks.json.

Black/Ruff настраиваются в корневом `pyproject.toml`, зависимости — в локальных `pyproject.toml` и `uv.lock`. При обновлении зависимостей lockfile пересоздаётся через uv lock и проходит ревью.
