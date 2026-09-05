import json
from dataclasses import dataclass, field

from pydantic import BaseModel

from task_models import (
    NumericTask1, ProcessTask1, ReadingPassage, SpeakingPart1,
    SpeakingPart2, SpeakingPart3, WritingTask2,
)


AUTHORING_RULES = (
    "Write original IELTS-style practice material in natural English. These are independent "
    "practice tasks, not official, recalled or predicted examination questions. Follow the "
    "specified task construct, not the surface grammar of a memorised example. Use neutral, "
    "idiomatic wording that an examiner could read aloud or print without editing. "
    "Avoid decorative introductions, fashionable buzzwords, moralising, implausible dilemmas, "
    "specialist knowledge requirements and invented claims about named researchers. "
    "Do not provide model answers, essay plans, vocabulary lists, band predictions or coaching "
    "inside candidate-facing fields. Return one complete JSON object matching the supplied "
    "schema. Before returning it, silently check clarity, task alignment, completeness and "
    "internal consistency. Return only the finished material, not your checks."
)

ESSAY_FORMATS = {
    "opinion": (
        "Present one debatable proposition about a specific policy or priority. A thoughtful "
        "candidate must be able to agree, disagree or qualify it. Do not ask for a second task.",
        "To what extent do you agree or disagree?",
    ),
    "discussion": (
        "Present two credible contrasting views on the SAME decision. Give each view similar "
        "specificity and weight. Do not make one view obviously unreasonable.",
        "Discuss both views and give your own opinion.",
    ),
    "advantages_disadvantages": (
        "Describe a concrete practice or trend with plausible benefits and drawbacks. "
        "Request both sides without adding an outweigh judgement or an agreement question.",
        "What are the advantages and disadvantages of this development?",
    ),
    "outweigh": (
        "Describe a practice or change with substantial benefits and costs. Require an overall "
        "comparison, not merely a list of advantages and disadvantages.",
        "Do the advantages of this development outweigh the disadvantages?",
    ),
    "causes_solutions": (
        "Describe an observable undesirable trend. Ask why it happens and how to address it. "
        "Do not supply its causes or proposed solutions in the premise.",
        "What are the causes of this problem, and what measures could be taken to solve it?",
    ),
    "problem_solution": (
        "Describe a situation that can produce identifiable problems. Ask about the resulting "
        "problems and responses to them, not the causes of the situation. Do not list the "
        "problems in advance or build solutions into the premise.",
        "What problems can this cause, and how could these problems be addressed?",
    ),
    "two_part": (
        "Give one specific social trend followed by exactly two related direct questions. "
        "For this practice variant, ask about the reasons for the trend and its effects on a "
        "clearly named group. Make both demands explicit and answerable without specialist "
        "knowledge. Do not add solutions, discussion of both views or a third question.",
        "",
    ),
    "positive_negative": (
        "Describe a change neutrally so the candidate can evaluate its overall significance. "
        "Do not call it beneficial or harmful in the premise and do not request causes.",
        "Do you think this is a positive or a negative development?",
    ),
}

ESSAY_TOPICS = {
    "education": ("assessment at school", "access to further education", "practical skills in the curriculum", "adult retraining"),
    "technology": ("automation of everyday services", "digital public services", "technology in family life", "access to digital skills"),
    "environment": ("household waste", "protection of local habitats", "repairing consumer goods", "use of public green space"),
    "health": ("opportunities for daily exercise", "preventive health education", "access to sports facilities", "work and personal well-being"),
    "government": ("funding public libraries", "local public spending priorities", "maintenance of public facilities", "support for rural communities"),
    "crime": ("rehabilitation after prison", "prevention of youth offending", "community crime prevention", "alternatives to imprisonment"),
    "work": ("flexible working hours", "career changes", "training employees", "workplace responsibilities"),
    "society": ("support between generations", "neighbourhood relationships", "community volunteering", "living alone"),
    "globalization": ("international cooperation", "movement of skilled workers", "local and imported products", "shared international culture"),
    "transport": ("commuting distances", "public transport access", "walking and cycling", "private car use in cities"),
    "housing": ("affordable urban housing", "housing density", "renovating existing buildings", "living near workplaces"),
    "media": ("local news", "advertising to young people", "access to public information", "entertainment and education"),
    "culture": ("local languages", "public support for the arts", "historic buildings", "access to museums"),
    "tourism": ("visitors in small communities", "domestic travel", "access to natural attractions", "local employment in tourism"),
    "science": ("funding scientific research", "science education for the public", "applied and theoretical research", "sharing scientific findings"),
}

PART1_TOPICS = (
    "your home", "your hometown", "your studies", "your daily routine", "cooking",
    "walking", "public transport", "reading", "music", "the weather", "weekends",
    "taking photographs", "making plans", "parks", "clothes", "messages", "shopping",
    "learning new things", "spending time with friends", "places to relax", "your work",
)

PART2_TOPICS = {
    "person": ("someone who taught you a useful skill", "a person you enjoy talking to", "someone who helps other people"),
    "place": ("a quiet place you like", "a public place you have visited", "a place in your area you would recommend"),
    "object": ("an object you use regularly", "something you have kept for a long time", "a gift that was useful to you"),
    "event": ("a celebration you enjoyed", "a local event you attended", "an occasion when people worked together"),
    "experience": ("a time you solved a practical problem", "a time you learned something outside school", "a time someone gave you helpful advice"),
    "activity": ("an activity you would like to learn", "something you enjoy doing outdoors", "an activity you do with other people"),
    "media": ("a story you found interesting", "a programme that taught you something", "a photograph that matters to you"),
}

READING_TOPICS = (
    "how seed banks preserve plant diversity", "the design of pedestrian-friendly streets",
    "how animals navigate", "the history of public libraries", "repair and reuse of materials",
    "the development of timekeeping", "how people learn unfamiliar skills",
    "the conservation of historic buildings", "the role of wetlands", "how maps influence decisions",
)

CHART_RULES = {
    "bar_chart": "Compare 3–5 named categories across 2–3 groups or dates. Include a clear overall contrast and a meaningful exception.",
    "line_graph": "Use 2–4 series and 4–6 ordered, equally spaced years. Include different trends, a peak or crossover, without making every series move identically.",
    "pie_chart": "Use 3–5 mutually exclusive categories and one or two populations or dates. Use % as the unit. Every pie must sum to exactly 100; use the same categories in both pies.",
    "table": "Use 3–5 rows and 3–4 comparable columns, all with the same stated unit. Include clear high/low values and a meaningful difference across groups.",
    "process_diagram": "Describe a plausible linear production process or natural cycle in 6–9 ordered stages. Each stage must name its input, action or transformation and output. For a cycle, make the final-to-first connection explicit.",
}


@dataclass(frozen=True)
class TaskSpec:
    system: str
    user: str
    response_model: type[BaseModel]
    metadata: dict = field(default_factory=dict)
    expected_fields: dict = field(default_factory=dict)
    required_ending: str = ""
    max_output_tokens: int = 8192

    def validate(self, data: dict) -> dict:
        result = self.response_model.model_validate(data).model_dump()
        for name, expected in self.expected_fields.items():
            if result.get(name) != expected:
                raise ValueError(f"{name} must equal {expected}")
        if self.required_ending and not result["prompt"].endswith(self.required_ending):
            raise ValueError(f"Use the required task instruction: {self.required_ending}")
        if result.get("task_type") == "two_part" and result["prompt"].count("?") != 2:
            raise ValueError("A two-part task must contain exactly two direct questions")
        if self.response_model is SpeakingPart2:
            result["cue_card"] = (
                result["opening"] + "\n\nYou should say:\n"
                + "\n".join("- " + point for point in result["bullet_points"])
                + "\n" + result["explanation"]
            )
        result.update(self.metadata)
        return result


class TaskCatalog:
    task_names = (
        "writing_task2", "writing_task1_academic", "reading_passage",
        "speaking_part1", "speaking_part2", "speaking_part3",
    )

    def build(self, task: str, index: int, existing: list[dict]) -> TaskSpec:
        builders = {
            "writing_task2": self._writing2,
            "writing_task1_academic": self._writing1,
            "reading_passage": self._reading,
            "speaking_part1": self._speaking1,
            "speaking_part2": self._speaking2,
            "speaking_part3": self._speaking3,
        }
        return builders[task](index, existing)

    def _writing2(self, index: int, existing: list[dict]) -> TaskSpec:
        subtype = tuple(ESSAY_FORMATS)[index % len(ESSAY_FORMATS)]
        topic = tuple(ESSAY_TOPICS)[index % len(ESSAY_TOPICS)]
        focuses = ESSAY_TOPICS[topic]
        focus = focuses[(index // len(ESSAY_TOPICS)) % len(focuses)]
        construct, ending = ESSAY_FORMATS[subtype]
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Write an Academic Writing Task 2 question, not an essay or a classroom debate. "
                "Keep the scope narrow enough for a developed 250-word response, but broad enough "
                "for contrasting arguments and examples. Use one or two concise context sentences "
                "followed by the task instruction; typically 30–70 words altogether. This is an "
                "editorial target, not an official question-length rule. Do not pad short prompts. "
                "Avoid the stock opening 'In today's rapidly changing world'. Do not give reasons, "
                "examples or a preferred answer in the question. A proposition may be strong, "
                "but must not be absurd or a false factual assertion. " + construct
            ),
            user=(
                f"Create task_type={subtype}, topic_category={topic}. Focus: {focus}. "
                f"{'End the prompt with exactly: ' + ending if ending else construct} "
                "Keep timing, word-count instructions and advice out of the prompt field."
            ),
            response_model=WritingTask2,
            expected_fields={"task_type": subtype, "topic_category": topic},
            required_ending=ending,
            metadata={
                "time_minutes": 40, "minimum_words": 250,
                "instructions": "Allow about 40 minutes. Write at least 250 words. Support your ideas with reasons and relevant examples.",
            },
        )

    def _speaking1(self, index: int, existing: list[dict]) -> TaskSpec:
        topic = PART1_TOPICS[index % len(PART1_TOPICS)]
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Produce a single topic set for Speaking Part 1, not the entire 4–5 minute part. "
                "Ask 4–5 short, personal questions about ordinary experiences and preferences. "
                "Use conversational vocabulary and usually one main demand per question. "
                "Cover different angles: current habits, a preference with a reason, a past "
                "experience or change, and a future wish when natural. Do not mechanically force "
                "all tenses into every topic. Questions must work without knowing earlier answers. "
                "Allow candidates who do not do the activity to answer; do not assume employment, "
                "children, wealth or foreign travel. For work or studies, begin by establishing "
                "the candidate's situation. Avoid public-policy analysis and abstract social debates."
            ),
            user=f"Create one coherent Part 1 set. Use topic={topic}. No answers or examiner commentary.",
            response_model=SpeakingPart1,
            expected_fields={"topic": topic},
            metadata={"scope": "single_topic_set"},
        )

    def _part2_seed(self, index: int) -> tuple[str, str]:
        category = tuple(PART2_TOPICS)[index % len(PART2_TOPICS)]
        topics = PART2_TOPICS[category]
        return category, topics[(index // len(PART2_TOPICS)) % len(topics)]

    def _speaking2(self, index: int, existing: list[dict]) -> TaskSpec:
        category, seed = self._part2_seed(index)
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Create a Speaking Part 2 long-turn card. The opening must begin 'Describe' "
                "and identify one concrete, accessible subject. Add exactly three short supporting "
                "cues, without bullets or numbering inside the strings, followed by a separate "
                "'and explain ...' cue asking for significance, feelings or reasons. "
                "Each cue must contribute something different, in a natural narrative order, "
                "giving enough scope for a 1–2 minute talk. Do not require an exceptional life "
                "event, expertise or an expensive experience. Add 1–2 brief personal rounding-off "
                "questions on the same subject; these are not abstract Part 3 questions. "
                "Use topic as a short thematic label that could anchor a Part 3 discussion."
            ),
            user=f"Create topic_category={category}. Starting idea: {seed}. Develop an original, coherent card.",
            response_model=SpeakingPart2,
            expected_fields={"topic_category": category},
            metadata={"preparation_seconds": 60, "speaking_seconds": {"minimum": 60, "maximum": 120}},
        )

    def _speaking3(self, index: int, existing: list[dict]) -> TaskSpec:
        cards = [item for item in existing if item.get("_task_type") == "speaking_part2" and item.get("cue_card")]
        if cards:
            card = cards[index % len(cards)]
            anchor = card["cue_card"]
        else:
            _, seed = self._part2_seed(index)
            anchor = "Describe " + seed + "."
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Create a Speaking Part 3 discussion linked to the supplied Part 2 subject. "
                "Move from that concrete subject to 2 related broader issues, with 5–6 questions "
                "overall. Progress through explanation, comparison or change, evaluation and "
                "speculation. Ask about people, institutions or society, rather than repeating "
                "the candidate's personal story. Keep spoken wording accessible; intellectual "
                "depth must come from reasoning, not jargon. Each question should explore a "
                "different angle and make sense independently of unrecorded answers. "
                "Avoid turning every theme into a government-policy debate."
            ),
            user="Create a coherent discussion using this Part 2 anchor as topic context:\n" + json.dumps(anchor),
            response_model=SpeakingPart3,
            metadata={"part2_anchor": anchor, "time_minutes": {"minimum": 4, "maximum": 5}},
        )

    def _writing1(self, index: int, existing: list[dict]) -> TaskSpec:
        chart = tuple(CHART_RULES)[index % len(CHART_RULES)]
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Create an Academic Writing Task 1 visual specification. All quantities are "
                "synthetic. Write a neutral candidate prompt identifying the visual, measure, "
                "population and dates where applicable, then asking for an overview of the main "
                "features and relevant comparisons. Do not reveal trends, maxima, explanations "
                "or an answer. The dataset must match every label and date in the prompt, use "
                "one stated unit and contain enough detail for a meaningful 150-word report. "
                "Keep numbers plausible and avoid random noise or perfectly uniform sequences. "
                "Periods may be years or named comparison groups; every numeric series must "
                "contain exactly those keys. Do not claim the data came from a real study. "
                "A process should show physical stages, not advice or an essay outline. "
                + CHART_RULES[chart]
            ),
            user=f"Create chart_type={chart}. Return a complete renderable specification for one task.",
            response_model=ProcessTask1 if chart == "process_diagram" else NumericTask1,
            expected_fields={"chart_type": chart},
            metadata={"time_minutes": 20, "minimum_words": 150, "visual_status": "not_rendered", "data_origin": "synthetic"},
        )

    def _reading(self, index: int, existing: list[dict]) -> TaskSpec:
        topic = READING_TOPICS[index % len(READING_TOPICS)]
        return TaskSpec(
            system=AUTHORING_RULES + (
                " Create one Academic Reading practice passage and a focused TRUE/FALSE/NOT GIVEN "
                "exercise, not a full 40-question test. Write approximately 750–850 words in six "
                "substantial paragraphs A–F. Use a coherent popular-academic article for an educated "
                "non-specialist reader. Give each paragraph a distinct role, develop an explanation "
                "or argument with qualified claims and concrete detail, and vary sentence structure. "
                "Explain unfamiliar technical terms in context. Do not write a five-paragraph "
                "school essay, an obvious list of facts prepared only for the questions, or fake "
                "quotations and attributions to named experts. Finish the article before designing "
                "the questions, then silently check each answer against the whole passage. "
                "Write exactly eight factual statements, in order of their relevant text locations. "
                "Use genuine paraphrase rather than identical-word spotting or double negatives. "
                "TRUE requires full textual support; FALSE requires an explicit contradiction; "
                "NOT GIVEN means the specific fact cannot be established either way. A missing "
                "detail is not FALSE. Do not use external knowledge, writer-opinion YES/NO tasks "
                "or statements whose two clauses deserve different verdicts. Include at least two "
                "of each answer for practice coverage, in an irregular order. Keep answers out of "
                "questions. Put them in answer_key with the paragraph, a short exact quotation "
                "and a concise explanation. For NOT GIVEN, quote the closest relevant context and "
                "identify precisely which comparison, motive, quantity or other detail is absent."
            ),
            user=f"Create an original passage about {topic}, with questions numbered 1–8 and a separate answer key.",
            response_model=ReadingPassage,
            metadata={
                "question_type": "true_false_not_given", "scope": "single_passage_practice",
                "instructions": "Classify each statement using the passage only: TRUE if supported, FALSE if contradicted, or NOT GIVEN if the information is insufficient.",
            },
            max_output_tokens=16384,
        )
