import math
import re
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator


def validate_english_text(value: str) -> str:
    value = value.strip()
    if not value or re.search(r"[А-Яа-яЁё]", value) or "```" in value:
        raise ValueError("Candidate-facing text must be non-empty English without Markdown fences")
    return value


EnglishText = Annotated[str, AfterValidator(validate_english_text)]
EssayType = Literal[
    "opinion", "discussion", "advantages_disadvantages", "outweigh",
    "causes_solutions", "problem_solution", "two_part", "positive_negative",
]


def require_unique(values: list[str]) -> None:
    normalized = [re.sub(r"\W+", " ", value.casefold()).strip() for value in values]
    if len(normalized) != len(set(normalized)):
        raise ValueError("Repeated items are not allowed")


class WritingTask2(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task_type: EssayType
    topic_category: EnglishText
    prompt: EnglishText

    @model_validator(mode="after")
    def validate_prompt_length(self):
        if not 25 <= len(self.prompt.split()) <= 100:
            raise ValueError("Task 2 prompt must contain 25–100 words, excluding test instructions")
        return self


class SpeakingPart1(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: EnglishText
    questions: list[EnglishText] = Field(min_length=4, max_length=5)

    @model_validator(mode="after")
    def validate_questions(self):
        require_unique(self.questions)
        if any(len(question.split()) > 30 for question in self.questions):
            raise ValueError("Part 1 questions must be short spoken questions")
        return self


class SpeakingPart2(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic_category: EnglishText
    topic: EnglishText
    opening: EnglishText
    bullet_points: list[EnglishText] = Field(min_length=3, max_length=3)
    explanation: EnglishText
    rounding_off_questions: list[EnglishText] = Field(min_length=1, max_length=2)

    @model_validator(mode="after")
    def validate_card(self):
        if not self.opening.startswith("Describe "):
            raise ValueError("A cue card must start with Describe")
        if not self.explanation.casefold().startswith("and explain "):
            raise ValueError("The final cue must start with and explain")
        require_unique(self.bullet_points + [self.explanation])
        return self


class SpeakingPart3(BaseModel):
    model_config = ConfigDict(extra="forbid")

    related_topic: EnglishText
    questions: list[EnglishText] = Field(min_length=5, max_length=6)

    @model_validator(mode="after")
    def validate_questions(self):
        require_unique(self.questions)
        if any(len(question.split()) > 40 for question in self.questions):
            raise ValueError("Part 3 questions must remain natural spoken questions")
        return self


class DataSeries(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: EnglishText
    values: dict[str, float]


class NumericTask1(BaseModel):
    model_config = ConfigDict(extra="forbid")

    chart_type: Literal["bar_chart", "line_graph", "pie_chart", "table"]
    title: EnglishText
    prompt: EnglishText
    unit: EnglishText
    periods: list[EnglishText] = Field(min_length=1, max_length=6)
    data_series: list[DataSeries] = Field(min_length=2, max_length=6)

    @model_validator(mode="after")
    def validate_data(self):
        require_unique(self.periods)
        require_unique([series.category for series in self.data_series])
        for series in self.data_series:
            if set(series.values) != set(self.periods):
                raise ValueError("Every series must have a value for every period")
            if any(not math.isfinite(value) or value < 0 for value in series.values.values()):
                raise ValueError("Values must be finite, non-negative numbers")
            if ("percent" in self.unit.casefold() or "%" in self.unit) and any(
                value > 100 for value in series.values.values()
            ):
                raise ValueError("Percentages must be between 0 and 100")
        if self.chart_type == "pie_chart":
            if self.unit != "%" or len(self.data_series) < 3 or len(self.periods) > 2:
                raise ValueError("Pie charts need %, at least three categories and one or two pies")
            for period in self.periods:
                if not math.isclose(sum(series.values[period] for series in self.data_series), 100, abs_tol=0.01):
                    raise ValueError("Each pie must total 100%")
        if self.chart_type == "line_graph" and len(self.periods) < 4:
            raise ValueError("A line graph needs at least four time points")
        if self.chart_type == "table" and len(self.periods) * len(self.data_series) < 8:
            raise ValueError("A table needs at least eight data cells for comparison")
        return self


class ProcessTask1(BaseModel):
    model_config = ConfigDict(extra="forbid")

    chart_type: Literal["process_diagram"]
    title: EnglishText
    prompt: EnglishText
    process_kind: Literal["linear", "cyclical"]
    process_steps: list[EnglishText] = Field(min_length=6, max_length=9)

    @model_validator(mode="after")
    def validate_steps(self):
        require_unique(self.process_steps)
        return self


class Paragraph(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: EnglishText
    text: EnglishText


class ReadingQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number: int
    statement: EnglishText


class ReadingAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number: int
    answer: Literal["TRUE", "FALSE", "NOT GIVEN"]
    paragraph: EnglishText
    evidence: EnglishText
    explanation: EnglishText


class ReadingPassage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: EnglishText
    paragraphs: list[Paragraph] = Field(min_length=6, max_length=6)
    questions: list[ReadingQuestion] = Field(min_length=8, max_length=8)
    answer_key: list[ReadingAnswer] = Field(min_length=8, max_length=8)

    @model_validator(mode="after")
    def validate_evidence(self):
        labels = [paragraph.label for paragraph in self.paragraphs]
        if labels != list("ABCDEF"):
            raise ValueError("Paragraphs must be labelled A–F in order")
        word_count = sum(len(paragraph.text.split()) for paragraph in self.paragraphs)
        if not 650 <= word_count <= 950:
            raise ValueError(f"Reading passage must contain 650–950 words; received {word_count}")
        numbers = list(range(1, 9))
        if [question.number for question in self.questions] != numbers:
            raise ValueError("Questions must be numbered 1–8")
        if [answer.number for answer in self.answer_key] != numbers:
            raise ValueError("Answer key must match questions 1–8")
        require_unique([question.statement for question in self.questions])
        paragraphs = {paragraph.label: paragraph.text for paragraph in self.paragraphs}
        positions = []
        for answer in self.answer_key:
            paragraph = paragraphs.get(answer.paragraph, "")
            if " ".join(answer.evidence.split()) not in " ".join(paragraph.split()):
                raise ValueError(f"Answer {answer.number}: evidence must be an exact passage quotation")
            positions.append(labels.index(answer.paragraph))
        if positions != sorted(positions):
            raise ValueError("Question evidence must follow the passage order")
        verdicts = [answer.answer for answer in self.answer_key]
        if any(verdicts.count(verdict) < 2 for verdict in ("TRUE", "FALSE", "NOT GIVEN")):
            raise ValueError("This practice set must contain at least two of each answer")
        return self
