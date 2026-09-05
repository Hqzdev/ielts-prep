import { contentEntrySchema, type ContentEntry } from "@/domain/task";

interface Passage {
  id: string;
  title: string;
  topic: string;
  paragraphs: { label: string; text: string }[];
  facts: {
    question: string;
    answer: string;
    paragraph: string;
    evidence: string;
    explanation: string;
  }[];
  people: {
    name: string;
    statement: string;
    evidence: string;
    paragraph: string;
    explanation: string;
  }[];
  headings: string[];
  process: { label: string; answer: string; evidence: string }[];
}

const passages: Passage[] = [
  {
    id: "rd-tools",
    title: "A library of useful things",
    topic: "society",
    paragraphs: [
      {
        label: "A",
        text: "In 2018, the town of Bracken opened a library that lent tools instead of books. Its first home was a disused railway office, donated by the council for a five-year trial. Residents had repeatedly told a local survey that they lacked storage space for equipment used only occasionally. The founders therefore saw the scheme as a response to a practical problem, rather than an attempt to persuade everyone to abandon ownership. A person who needed a drill every week was still likely to buy one; a person putting up one shelf could borrow instead.",
      },
      {
        label: "B",
        text: "Librarian Maya Chen designed the borrowing system. Members could reserve items online, but telephone reservations were also accepted. Chen insisted that internet access should never be a condition of membership. Loans lasted seven days, and borrowing the same item again was possible if nobody else had reserved it. At first, staff expected power tools to dominate demand. In fact, carpet cleaners accounted for the largest number of loans during the first year. They were expensive to buy and particularly awkward to store in small flats.",
      },
      {
        label: "C",
        text: "Engineer Daniel Reed was responsible for safety. He introduced a check after every return, even when a borrower reported no problems. Every returned item first went to the inspection bench. Staff then attached a green label to equipment that passed the check. Labelled equipment moved to the storage shelf, where it waited for collection. Anything damaged went into a locked cabinet until Reed could examine it. This arrangement kept untested equipment out of circulation without requiring volunteers to decide whether a reported fault was serious.",
      },
      {
        label: "D",
        text: "Economist Amina Patel evaluated the trial. The library recorded the number of loans, but Patel argued that this alone could not reveal how many purchases had been avoided. Some borrowers would otherwise have hired equipment or asked a neighbour for help. Her study therefore used follow-up interviews to establish what people would probably have done without the library. Patel concluded that claims about environmental benefits should be based on these alternatives, not simply on the popularity of the service. In her view, honest measurement was more valuable than an impressive headline.",
      },
      {
        label: "E",
        text: "Repair workshops became an unexpected part of the programme. Sessions were held on Saturdays and were free for members. Initially, volunteers demonstrated repairs while visitors watched. Later, visitors were encouraged to carry out the work themselves under supervision. Attendance rose after this change. Participants said that practising a technique gave them more confidence than watching someone else perform it. The workshops also created informal connections between residents who had lived in the same street for years without meeting.",
      },
      {
        label: "F",
        text: "At the end of the trial, the council renewed the lease. The library had not eliminated private ownership, nor had its founders expected it to. It had, however, given residents another way to obtain equipment and learn practical skills. There is a strong case for assessing such projects against these realistic goals. Treating a small local service as a complete solution to excessive consumption risks overlooking its more modest achievements. Bracken's experience suggests that useful institutions can change everyday habits without claiming to transform society overnight.",
      },
    ],
    facts: [
      {
        question: "The first library occupied a former ______.",
        answer: "railway office",
        paragraph: "A",
        evidence: "Its first home was a disused railway office",
        explanation:
          "The first location is explicitly described as a former railway office.",
      },
      {
        question:
          "Residents said they did not have enough ______ for rarely used equipment.",
        answer: "storage space",
        paragraph: "A",
        evidence: "they lacked storage space",
        explanation:
          "Residents lacked storage space, rather than money to buy equipment.",
      },
      {
        question: "During the first year, ______ were borrowed most often.",
        answer: "carpet cleaners",
        paragraph: "B",
        evidence: "carpet cleaners accounted for the largest number of loans",
        explanation:
          "Carpet cleaners were borrowed most often, contrary to the initial expectation that power tools would be most popular.",
      },
      {
        question: "Patel used ______ to investigate alternatives to borrowing.",
        answer: "follow-up interviews",
        paragraph: "D",
        evidence: "used follow-up interviews",
        explanation:
          "The researcher used follow-up interviews to find out what borrowers would otherwise have done.",
      },
    ],
    people: [
      {
        name: "Maya Chen",
        statement:
          "Members should be able to reserve equipment without going online.",
        evidence: "telephone reservations were also accepted",
        paragraph: "B",
        explanation:
          "Telephone reservations were part of the system designed by Maya Chen.",
      },
      {
        name: "Daniel Reed",
        statement:
          "Equipment should be checked even if no fault has been reported.",
        evidence:
          "a check after every return, even when a borrower reported no problems",
        paragraph: "C",
        explanation:
          "Daniel Reed introduced the requirement to inspect every returned item.",
      },
      {
        name: "Amina Patel",
        statement:
          "Counting loans is insufficient to measure avoided purchases.",
        evidence:
          "this alone could not reveal how many purchases had been avoided",
        paragraph: "D",
        explanation:
          "Amina Patel explains why loan statistics alone are not enough.",
      },
      {
        name: "Amina Patel",
        statement: "Credible measurement matters more than publicity.",
        evidence:
          "honest measurement was more valuable than an impressive headline",
        paragraph: "D",
        explanation:
          "The paragraph ends by stating Patel's priority: honest measurement.",
      },
    ],
    headings: [
      "A practical reason to share equipment",
      "Making borrowing accessible",
      "Keeping unchecked equipment separate",
      "Measuring what the service actually changes",
      "Learning by doing",
      "Judging a project by realistic goals",
    ],
    process: [
      {
        label: "Returned item arrives at the",
        answer: "inspection bench",
        evidence: "Every returned item first went to the inspection bench",
      },
      {
        label: "Passed check: attach a",
        answer: "green label",
        evidence: "attached a green label",
      },
      {
        label: "Ready for collection: move to the",
        answer: "storage shelf",
        evidence: "Labelled equipment moved to the storage shelf",
      },
      {
        label: "Failed check: place in a",
        answer: "locked cabinet",
        evidence: "Anything damaged went into a locked cabinet",
      },
    ],
  },
  {
    id: "rd-rain",
    title: "Following rain through a city garden",
    topic: "environment",
    paragraphs: [
      {
        label: "A",
        text: "When the city of Mereford converted an abandoned car park into a rain garden, its immediate aim was to reduce pressure on the drainage system. During storms, water had run off the hard surface almost instantly, contributing to flooding farther downhill. The new garden replaced most of the asphalt with planted beds. These beds temporarily held rainwater and allowed some of it to soak into the ground. The project was designed for ordinary seasonal storms; its planners never claimed that a single garden could prevent flooding during every extreme event.",
      },
      {
        label: "B",
        text: "Landscape designer Nora Bell selected native grasses for the lowest parts of the garden. These plants could tolerate both brief flooding and periods of dry weather. Bell rejected the suggestion that plants requiring frequent watering would necessarily make the garden more attractive. Instead, she used differences in leaf shape and height to create visual interest. Signs explained why the central beds sometimes looked untidy in winter. Bell considered public understanding important: a garden designed to manage water should not be judged only by the standards of a formal flower display.",
      },
      {
        label: "C",
        text: "Water engineer Owen Price designed a visible demonstration channel beside the main beds. Water from the roof first passed through a leaf screen, which trapped larger pieces of debris. It then entered a settling tank, where heavier particles sank to the bottom. From there it flowed through a gravel bed before reaching a storage barrel. Water in the barrel was used on nearby trees during dry periods. The demonstration channel was separate from the system that handled runoff from the former car park, so visitors could inspect it safely.",
      },
      {
        label: "D",
        text: "Researcher Leila Grant compared the site's performance before and after construction. She installed sensors to record water depth in the planted beds. However, depth measurements alone did not show how much water had entered the garden. Grant also measured rainfall and the rate of outflow. Her report warned against comparing two storms merely because they lasted the same length of time: their intensity could be very different. She argued that transparent methods were essential if other cities were to use the results when planning similar projects.",
      },
      {
        label: "E",
        text: "Local schools began visiting the garden in spring. At first, teachers led tours using printed explanations. Later, children collected measurements and compared them with readings from previous weeks. Teachers reported that this practical activity led to more questions than the guided tours had. The children were particularly interested in why the beds could remain damp after the paths had dried. The project team eventually added a simple measuring scale beside one bed so that visitors could make observations without entering the planted area.",
      },
      {
        label: "F",
        text: "After three years, the garden remained part of a wider flood-management programme. Maintenance was necessary: blocked entrances had to be cleared and litter removed after heavy rain. Nevertheless, the site combined useful drainage with an accessible place to learn about water. It would be unreasonable to dismiss these benefits because the garden could not solve the city's entire flooding problem. Small projects deserve careful evaluation, but they can also have educational value that is not captured by a single engineering measurement.",
      },
    ],
    facts: [
      {
        question: "The garden replaced an abandoned ______.",
        answer: "car park",
        paragraph: "A",
        evidence: "converted an abandoned car park",
        explanation: "The garden replaced a disused car park.",
      },
      {
        question: "The original hard surface was mostly made of ______.",
        answer: "asphalt",
        paragraph: "A",
        evidence: "replaced most of the asphalt",
        explanation:
          "The passage explicitly identifies asphalt as the surface replaced by planting.",
      },
      {
        question: "Bell planted ______ in the lowest areas.",
        answer: "native grasses",
        paragraph: "B",
        evidence: "selected native grasses for the lowest parts",
        explanation:
          "Native grasses that tolerate different moisture conditions were chosen for the lower areas.",
      },
      {
        question: "Grant's sensors measured ______ in the beds.",
        answer: "water depth",
        paragraph: "D",
        evidence: "sensors to record water depth",
        explanation: "The sensors measured water depth, not just rainfall.",
      },
    ],
    people: [
      {
        name: "Nora Bell",
        statement:
          "A water-management garden needs a different standard of appearance.",
        evidence:
          "should not be judged only by the standards of a formal flower display",
        paragraph: "B",
        explanation:
          "Nora Bell explains why the appearance of this kind of garden is judged differently.",
      },
      {
        name: "Owen Price",
        statement:
          "Visitors should be able to inspect a separate demonstration system safely.",
        evidence: "visitors could inspect it safely",
        paragraph: "C",
        explanation: "Owen Price designed the demonstration channel.",
      },
      {
        name: "Leila Grant",
        statement: "Equal storm duration does not imply equal storm intensity.",
        evidence: "their intensity could be very different",
        paragraph: "D",
        explanation:
          "Leila Grant warns against comparing storms by duration alone.",
      },
      {
        name: "Leila Grant",
        statement: "Other cities need clearly described research methods.",
        evidence: "transparent methods were essential",
        paragraph: "D",
        explanation:
          "Researcher Grant insists on transparency about the method.",
      },
    ],
    headings: [
      "Replacing a surface that shed water quickly",
      "Choosing plants for changing conditions",
      "A visible route for collected water",
      "Making a fair comparison of performance",
      "Learning through measurement",
      "Benefits beyond a single engineering target",
    ],
    process: [
      {
        label: "Roof water passes through a",
        answer: "leaf screen",
        evidence: "Water from the roof first passed through a leaf screen",
      },
      {
        label: "Heavier particles sink in a",
        answer: "settling tank",
        evidence: "It then entered a settling tank",
      },
      {
        label: "Water next flows through a",
        answer: "gravel bed",
        evidence: "it flowed through a gravel bed",
      },
      {
        label: "Water for trees is collected in a",
        answer: "storage barrel",
        evidence: "before reaching a storage barrel",
      },
    ],
  },
];

const formats = [
  "multiple_choice",
  "yes_no_not_given",
  "matching_information",
  "matching_headings",
  "matching_features",
  "matching_sentence_endings",
  "sentence_completion",
  "summary_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "diagram_label_completion",
  "short_answer",
];

export function extendedReading(): ContentEntry[] {
  return passages.flatMap((passage, passageIndex) =>
    formats.map((format, formatIndex) => {
      const facts = passage.facts;
      const base = {
        id: `rd-${String(21 + passageIndex * 13 + formatIndex).padStart(3, "0")}`,
        title: `${passage.title} · ${formatIndex + 1}`,
        skill: "reading",
        part: 1,
        topic: passage.topic,
        format,
        durationSeconds: 600,
        prompt: passage.title,
        createdAt: "2026-09-03",
        passageId: passage.id,
        paragraphs: passage.paragraphs,
        reuseAllowed: true,
      };
      let instructions =
        "Complete the answers. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
      let questions: unknown[] = facts.map((fact, index) => ({
        number: index + 1,
        statement: fact.question,
        mode: "text",
        maxWords: 2,
      }));
      let keys: unknown[] = facts.map((fact, index) => ({
        number: index + 1,
        answers: [fact.answer],
        paragraph: fact.paragraph,
        evidence: fact.evidence,
        explanation: fact.explanation,
      }));
      let readingLayout = "list";
      let diagram: unknown;
      if (format === "multiple_choice") {
        instructions =
          "Choose ONE letter for question 1 and TWO letters for question 2.";
        questions = [
          {
            number: 1,
            statement: "What is the writer's overall view of the project?",
            mode: "single",
            options: [
              {
                value: "A",
                label: "It should be assessed against realistic goals.",
              },
              {
                value: "B",
                label: "It has completely solved a city-wide problem.",
              },
              {
                value: "C",
                label: "Its educational effects make measurement unnecessary.",
              },
              {
                value: "D",
                label: "It should be closed because maintenance is needed.",
              },
            ],
          },
          {
            number: 2,
            statement: "Which TWO activities are described in the passage?",
            mode: "multiple",
            selectCount: 2,
            options:
              passageIndex === 0
                ? [
                    { value: "A", label: "Checking returned equipment" },
                    { value: "B", label: "Teaching visitors practical skills" },
                    { value: "C", label: "Selling new power tools" },
                    {
                      value: "D",
                      label: "Charging members for every workshop",
                    },
                    { value: "E", label: "Delivering equipment to every home" },
                  ]
                : [
                    { value: "A", label: "Recording water depth" },
                    {
                      value: "B",
                      label: "Letting children collect measurements",
                    },
                    { value: "C", label: "Eliminating all maintenance work" },
                    {
                      value: "D",
                      label: "Guaranteeing protection from every flood",
                    },
                    { value: "E", label: "Replacing all city drains" },
                  ],
          },
        ];
        keys = [
          {
            number: 1,
            answers: ["A"],
            paragraph: "F",
            evidence:
              passageIndex === 0
                ? "assessing such projects against these realistic goals"
                : "Small projects deserve careful evaluation",
            explanation:
              "The author suggests judging the project's benefits against its realistic goals.",
          },
          {
            number: 2,
            answers: ["A", "B"],
            paragraph: passageIndex === 0 ? "C" : "D",
            evidence:
              passageIndex === 0
                ? "a check after every return"
                : "sensors to record water depth",
            explanation:
              passageIndex === 0
                ? "Paragraph C describes equipment inspections; paragraph E describes visitors doing repairs themselves."
                : "Paragraph D describes sensor measurements; paragraph E describes children taking practical measurements.",
          },
        ];
      } else if (format === "yes_no_not_given") {
        instructions =
          "Do the statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.";
        const statements =
          passageIndex === 0
            ? [
                "A project can be useful without transforming society completely.",
                "The library ought to be judged as a complete solution to excessive consumption.",
                "Every town should spend the same amount on a library of things.",
              ]
            : [
                "The garden has benefits even though it cannot solve all flooding problems.",
                "A single engineering measurement captures all the educational value of the garden.",
                "All future rain gardens should be larger than Mereford's garden.",
              ];
        questions = statements.map((statement, index) => ({
          number: index + 1,
          statement,
          mode: "single",
          options: ["YES", "NO", "NOT GIVEN"].map((value) => ({
            value,
            label: value,
          })),
        }));
        keys = [
          {
            number: 1,
            answers: ["YES"],
            paragraph: "F",
            evidence:
              passageIndex === 0
                ? "useful institutions can change everyday habits without claiming to transform society overnight"
                : "It would be unreasonable to dismiss these benefits",
            explanation:
              "The author explicitly acknowledges the project's value despite its limited scale.",
          },
          {
            number: 2,
            answers: ["NO"],
            paragraph: "F",
            evidence:
              passageIndex === 0
                ? "Treating a small local service as a complete solution to excessive consumption risks overlooking its more modest achievements"
                : "educational value that is not captured by a single engineering measurement",
            explanation: "The statement contradicts the author's position.",
          },
          {
            number: 3,
            answers: ["NOT GIVEN"],
            paragraph: "F",
            evidence: passage.paragraphs[5].text,
            explanation:
              "The author does not set this requirement for all future projects. It is neither confirmed nor contradicted.",
          },
        ];
      } else if (format === "matching_information") {
        instructions =
          "Which paragraph contains the following information? You may use any letter more than once.";
        questions = facts.map((fact, index) => ({
          number: index + 1,
          statement: fact.question.replace("______", fact.answer),
          mode: "single",
          options: passage.paragraphs.map((p) => ({
            value: p.label,
            label: p.label,
          })),
        }));
        keys = facts.map((fact, index) => ({
          number: index + 1,
          answers: [fact.paragraph],
          paragraph: fact.paragraph,
          evidence: fact.evidence,
          explanation: fact.explanation,
        }));
      } else if (format === "matching_headings") {
        instructions =
          "Choose the correct heading for each paragraph. Use each heading only once.";
        const headings = [
          ...passage.headings,
          "A plan to close the project",
          "Replacing all professional staff",
        ];
        const options = headings.map((label, index) => ({
          value: String(index + 1),
          label: `${index + 1}. ${label}`,
        }));
        questions = passage.paragraphs.map((p, index) => ({
          number: index + 1,
          statement: `Paragraph ${p.label}`,
          mode: "single",
          options,
        }));
        keys = passage.paragraphs.map((p, index) => ({
          number: index + 1,
          answers: [String(index + 1)],
          paragraph: p.label,
          evidence: p.text,
          explanation: `The main idea of the paragraph is “${passage.headings[index]}”. The other headings refer to different aspects of the project.`,
        }));
      } else if (format === "matching_features") {
        instructions =
          "Match each statement with the correct person. You may use each person more than once.";
        const names = [...new Set(passage.people.map((person) => person.name))];
        questions = passage.people.map((person, index) => ({
          number: index + 1,
          statement: person.statement,
          mode: "single",
          options: names.map((name, i) => ({
            value: String(i + 1),
            label: name,
          })),
        }));
        keys = passage.people.map((person, index) => ({
          number: index + 1,
          answers: [String(names.indexOf(person.name) + 1)],
          paragraph: person.paragraph,
          evidence: person.evidence,
          explanation: person.explanation,
        }));
      } else if (format === "matching_sentence_endings") {
        instructions =
          "Complete each sentence with the correct ending. Use each ending only once.";
        const endings = [
          ...facts.map((f) => f.answer),
          "a public swimming pool",
          "commercial advertising",
        ];
        questions = facts.map((fact, index) => ({
          number: index + 1,
          statement: fact.question,
          mode: "single",
          options: endings.map((label, i) => ({
            value: String.fromCharCode(65 + i),
            label: `${String.fromCharCode(65 + i)}. ${label}`,
          })),
        }));
        keys = facts.map((fact, index) => ({
          number: index + 1,
          answers: [String.fromCharCode(65 + index)],
          paragraph: fact.paragraph,
          evidence: fact.evidence,
          explanation: fact.explanation,
        }));
      } else if (format === "summary_completion" && passageIndex === 1) {
        instructions =
          "Complete the summary using words from the box. Use each option only once.";
        const options = [
          ...facts.map((f) => f.answer),
          "concrete",
          "rainfall",
        ].map((label, i) => ({ value: String.fromCharCode(65 + i), label }));
        questions = facts.map((fact, index) => ({
          number: index + 1,
          statement: fact.question,
          mode: "single",
          options,
        }));
        keys = facts.map((fact, index) => ({
          number: index + 1,
          answers: [String.fromCharCode(65 + index)],
          paragraph: fact.paragraph,
          evidence: fact.evidence,
          explanation: fact.explanation,
        }));
        readingLayout = "summary";
      } else if (
        ["flow_chart_completion", "diagram_label_completion"].includes(format)
      ) {
        readingLayout =
          format === "flow_chart_completion" ? "flowchart" : "diagram";
        questions = passage.process.map((step, index) => ({
          number: index + 1,
          statement: step.label + " ______",
          mode: "text",
          maxWords: 2,
        }));
        keys = passage.process.map((step, index) => ({
          number: index + 1,
          answers: [step.answer],
          paragraph: "C",
          evidence: step.evidence,
          explanation: `The diagram requires the name of a stage or item: ${step.answer}. It is stated in paragraph C.`,
        }));
        if (readingLayout === "diagram")
          diagram = {
            title:
              passageIndex === 0
                ? "Tool inspection and storage"
                : "Rainwater demonstration channel",
            nodes: passage.process.map((step, index) => ({
              id: String(index + 1),
              label: step.label,
              x: (index % 2) * 260,
              y: Math.floor(index / 2) * 160,
              questionNumber: index + 1,
            })),
            edges:
              passageIndex === 0
                ? [
                    { source: "1", target: "2" },
                    { source: "2", target: "3" },
                    { source: "1", target: "4" },
                  ]
                : [
                    { source: "1", target: "2" },
                    { source: "2", target: "3" },
                    { source: "3", target: "4" },
                  ],
          };
      } else if (format === "short_answer") {
        questions = facts.map((fact, index) => ({
          number: index + 1,
          statement:
            passageIndex === 0
              ? [
                  "What type of building first housed the library?",
                  "What did residents lack for rarely used equipment?",
                  "Which items had the highest number of loans?",
                  "What did Patel conduct to study alternatives?",
                ][index]
              : [
                  "What occupied the site before the garden?",
                  "What material covered most of the original site?",
                  "What plants did Bell choose for the lowest areas?",
                  "What did Grant's sensors record?",
                ][index],
          mode: "text",
          maxWords: 2,
        }));
        if (passageIndex === 0) {
          instructions =
            "Answer the questions. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.";
          questions.push({
            number: 5,
            statement: "In which year did the library open?",
            mode: "text",
            maxWords: 2,
            allowNumber: true,
          });
          keys.push({
            number: 5,
            answers: ["2018"],
            paragraph: "A",
            evidence: "In 2018, the town of Bracken opened a library",
            explanation:
              "The opening year, 2018, is given in the first sentence.",
          });
        }
      } else if (format === "summary_completion") readingLayout = "summary";
      else if (format === "note_completion") readingLayout = "notes";
      else if (format === "table_completion") readingLayout = "table";
      return contentEntrySchema.parse({
        task: {
          ...base,
          instructions,
          readingQuestions: questions,
          readingLayout,
          diagram,
          reuseAllowed: ![
            "matching_headings",
            "matching_sentence_endings",
          ].includes(format),
        },
        readingKey: keys,
      });
    }),
  );
}
