import unittest
from types import SimpleNamespace

from generate_tasks import TaskHistory, parse_json_response
from task_models import WritingTask2
from task_specs import TaskCatalog


class GeneratorTests(unittest.TestCase):
    def test_every_task_kind_produces_a_schema_without_calling_ai(self):
        catalog = TaskCatalog()
        for task in catalog.task_names:
            for index in range(20):
                with self.subTest(task=task, index=index):
                    specification = catalog.build(task, index, [])
                    self.assertTrue(specification.user)
                    self.assertTrue(specification.response_model.model_json_schema())

    def test_duplicate_prompts_are_rejected_even_when_case_changes(self):
        prompt = "Schools should teach practical financial skills to older students."
        history = TaskHistory(
            [{"_task_type": "writing_task2", "prompt": prompt}], "writing_task2"
        )
        with self.assertRaises(ValueError):
            history.validate_novelty({"prompt": prompt.upper()})

    def test_response_parser_accepts_json_and_rejects_truncation(self):
        candidate = SimpleNamespace(
            finish_reason="STOP",
            content=SimpleNamespace(parts=[SimpleNamespace(text='{"title":"A task"}')]),
        )
        response = SimpleNamespace(candidates=[candidate])
        self.assertEqual(parse_json_response(response), {"title": "A task"})
        candidate.finish_reason = "MAX_TOKENS"
        with self.assertRaises(ValueError):
            parse_json_response(response)

    def test_model_forbids_unrecognized_output_fields(self):
        with self.assertRaises(ValueError):
            WritingTask2.model_validate({"prompt": "Task", "answer": "Invented"})


if __name__ == "__main__":
    unittest.main()
