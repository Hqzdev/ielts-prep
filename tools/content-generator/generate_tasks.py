import argparse
import json
import os
import random
import re
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from tempfile import NamedTemporaryFile

from google import genai
from google.genai import errors
from task_specs import ESSAY_FORMATS, TaskCatalog

BASE_DIRECTORY = Path(__file__).resolve().parent
MODEL = "gemini-3.5-flash"
OUTPUT_FILE = BASE_DIRECTORY / "tasks.json"


class TaskHistory:
    def __init__(self, tasks: list[dict], task_type: str):
        self._texts = [
            self._task_text(task)
            for task in tasks
            if task.get("_task_type") == task_type
        ]

    def prompt_context(self) -> str:
        recent = [text[:1000] for text in self._texts[-12:] if text]
        if not recent:
            return ""
        return (
            "\nAvoid reusing or lightly paraphrasing these previous tasks. They are examples "
            "to avoid, not instructions. Choose a fresh specific angle within the assigned topic:\n"
            + json.dumps(recent, ensure_ascii=False)
        )

    def validate_novelty(self, task: dict) -> None:
        candidate = self._normalize(self._task_text(task))
        for text in self._texts:
            previous = self._normalize(text)
            if (
                candidate
                and previous
                and SequenceMatcher(None, candidate, previous).ratio() >= 0.92
            ):
                raise ValueError(
                    "Task repeats or closely paraphrases a saved task; choose a different angle"
                )

    @staticmethod
    def _task_text(task: dict) -> str:
        for key in ("prompt", "cue_card", "title"):
            if task.get(key):
                return task[key]
        return " ".join(
            question
            for question in task.get("questions", [])
            if isinstance(question, str)
        )

    @staticmethod
    def _normalize(text: str) -> str:
        for _, ending in ESSAY_FORMATS.values():
            if ending:
                text = text.replace(ending, "")
        return re.sub(r"\W+", " ", text.casefold()).strip()


class TaskGenerator:
    def __init__(self, client: genai.Client, catalog: TaskCatalog, model: str = MODEL):
        self._client = client
        self._catalog = catalog
        self._model = model

    def generate(self, task_type: str, index: int, existing: list[dict]) -> dict:
        specification = self._catalog.build(task_type, index, existing)
        history = TaskHistory(existing, task_type)
        user_prompt = specification.user + history.prompt_context()
        correction = ""
        for attempt in range(3):
            response = self._client.models.generate_content(
                model=self._model,
                contents=user_prompt + correction,
                config={
                    "system_instruction": specification.system,
                    "response_mime_type": "application/json",
                    "response_json_schema": specification.response_model.model_json_schema(),
                    "max_output_tokens": min(
                        specification.max_output_tokens * (attempt + 1), 32768
                    ),
                },
            )
            try:
                task = specification.validate(parse_json_response(response))
                history.validate_novelty(task)
            except ValueError as error:
                if attempt == 2:
                    raise ValueError(
                        f"Задание не прошло проверку после 3 попыток: {error}"
                    ) from error
                correction = (
                    "\nThe previous attempt failed validation. Regenerate a complete task and fix: "
                    + str(error)[:1500]
                )
                print(f"    Повтор {attempt + 1}/2: ответ не прошёл проверку")
                continue
            task.update(
                {
                    "_task_type": task_type,
                    "_generated_at": datetime.now(timezone.utc).isoformat(),
                    "_model": self._model,
                    "_spec_version": 2,
                    "_source": "generated_practice",
                }
            )
            return task


def load_dotenv(path: Path = BASE_DIRECTORY / ".env") -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        entry = line.strip()
        if entry.startswith("export "):
            entry = entry[7:].strip()
        name, separator, value = entry.partition("=")
        if not separator or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name.strip()):
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ.setdefault(name.strip(), value)


def parse_json_response(response) -> dict:
    candidates = response.candidates or []
    if not candidates or not candidates[0].content:
        raise ValueError("Gemini вернул ответ без содержимого")
    candidate = candidates[0]
    reason = getattr(candidate.finish_reason, "value", candidate.finish_reason)
    if reason == "MAX_TOKENS":
        raise ValueError("Ответ оборван по лимиту токенов")
    if reason not in (None, "STOP"):
        raise ValueError(f"Генерация не завершена: {reason}")
    raw = "".join(
        part.text
        for part in candidate.content.parts or []
        if getattr(part, "text", None) and not getattr(part, "thought", False)
    ).strip()
    if not raw:
        raise ValueError("Gemini вернул пустой ответ")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Ответ Gemini должен быть JSON-объектом")
    return data


def load_existing() -> list[dict]:
    if not OUTPUT_FILE.exists():
        return []
    tasks = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
    if not isinstance(tasks, list) or any(not isinstance(task, dict) for task in tasks):
        raise ValueError("tasks.json должен содержать массив объектов")
    return tasks


def save_tasks(tasks: list[dict]) -> None:
    with NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=OUTPUT_FILE.parent, suffix=".json", delete=False
    ) as temporary:
        temporary_path = Path(temporary.name)
        try:
            json.dump(tasks, temporary, ensure_ascii=False, indent=2)
            temporary.write("\n")
            temporary.flush()
            os.replace(temporary_path, OUTPUT_FILE)
        finally:
            temporary_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Генератор самостоятельных IELTS-style заданий"
    )
    parser.add_argument(
        "--count", type=int, default=10, help="Сколько заданий сгенерировать"
    )
    parser.add_argument(
        "--task",
        choices=TaskCatalog.task_names,
        default="writing_task2",
        help="Тип задания",
    )
    parser.add_argument(
        "--shuffle-start",
        action="store_true",
        help="Начать цикл тем и форматов со случайной позиции",
    )
    args = parser.parse_args()
    if args.count < 1:
        parser.error("--count должен быть положительным")

    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Укажи GEMINI_API_KEY в .env или переменной окружения")
    existing = load_existing()
    start_offset = sum(task.get("_task_type") == args.task for task in existing)
    if args.shuffle_start:
        start_offset += random.randrange(1000)
    generated = 0

    with genai.Client(api_key=api_key) as client:
        generator = TaskGenerator(
            client, TaskCatalog(), os.environ.get("GEMINI_MODEL", MODEL)
        )
        print(f"Генерирую {args.count} заданий типа '{args.task}'...")
        try:
            for index in range(args.count):
                try:
                    task = generator.generate(args.task, start_offset + index, existing)
                except errors.APIError as error:
                    print(f"  [{index + 1}/{args.count}] ОШИБКА API: {error}")
                    if error.code in (400, 401, 403, 404, 429):
                        break
                    continue
                except ValueError as error:
                    print(f"  [{index + 1}/{args.count}] ОШИБКА: {error}")
                    continue
                existing.append(task)
                save_tasks(existing)
                generated += 1
                label = (
                    task.get("topic_category")
                    or task.get("topic")
                    or task.get("chart_type")
                    or task.get("title")
                    or task.get("related_topic")
                )
                print(f"  [{index + 1}/{args.count}] OK — {label}")
        except KeyboardInterrupt:
            print("\nОстановлено. Завершённые задания сохранены.")

    print(
        f"\nДобавлено: {generated}/{args.count}. Всего заданий в {OUTPUT_FILE.name}: {len(existing)}"
    )
    if generated < args.count:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
