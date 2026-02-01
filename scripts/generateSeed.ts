/**
 * Generates questions.seed.json with 220+ MCQs
 * Run: tsx scripts/generateSeed.ts
 */

import * as fs from "fs";
import * as path from "path";

const SESSIONS = ["Session 1", "Session 2", "Session 3", "Session 4"];

const TOPICS = [
  "Skills and Roles",
  "Communication",
  "Standards of Conduct",
  "Team Dynamics",
  "Contract Principles",
  "Plan Solicitation",
  "Request Offers",
  "Price/Cost Analysis",
  "Negotiation",
  "Source Selection",
  "Disagreements",
  "Administer Contract",
  "Manage Changes",
  "Ensure Quality",
  "Subcontracts",
  "Closeout",
];

const SESSION_TOPICS: Record<string, string[]> = {
  "Session 1": [
    "Skills and Roles",
    "Communication",
    "Standards of Conduct",
    "Team Dynamics",
  ],
  "Session 2": [
    "Contract Principles",
    "Plan Solicitation",
    "Request Offers",
  ],
  "Session 3": [
    "Price/Cost Analysis",
    "Negotiation",
    "Source Selection",
    "Disagreements",
  ],
  "Session 4": [
    "Administer Contract",
    "Manage Changes",
    "Ensure Quality",
    "Subcontracts",
    "Closeout",
  ],
};

interface SeedQuestion {
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
  tags: string[];
  farRefs: string[];
  difficulty: number;
  source?: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateTopicQuestions(
  session: string,
  topic: string,
  count: number
): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  const terms = [
    "contracting officer",
    "procurement",
    "FAR",
    "acquisition",
    "solicitation",
    "offer",
    "source selection",
    "negotiation",
    "subcontract",
    "closeout",
    "documentation",
    "compliance",
    "ethics",
    "stakeholder",
  ];

  const patterns = [
    {
      prompt: `Which of the following best describes the primary role of a ${topic.replace(" ", " ").toLowerCase()} in federal contracting?`,
      correct: "Ensuring compliance with FAR requirements and maintaining proper documentation throughout the process.",
      wrong: [
        "Minimizing all contractor communication to reduce liability.",
        "Delegating all decisions to technical personnel.",
        "Avoiding written records to streamline operations.",
      ],
    },
    {
      prompt: `What is a key consideration when evaluating ${terms[Math.floor(Math.random() * terms.length)]} in ${topic}?`,
      correct: "Documenting the rationale and maintaining an audit trail for all decisions.",
      wrong: [
        "Making decisions based solely on verbal agreements.",
        "Excluding technical input from the evaluation.",
        "Rushing through reviews to meet arbitrary deadlines.",
      ],
    },
    {
      prompt: `In ${topic}, which action supports ethical conduct?`,
      correct: "Disclosing conflicts of interest and recusing when appropriate.",
      wrong: [
        "Withholding information to gain advantage in negotiations.",
        "Accepting gifts from potential contractors.",
        "Sharing proprietary information with competitors.",
      ],
    },
    {
      prompt: `Effective ${topic} requires:`,
      correct: "Clear communication with all stakeholders and thorough documentation.",
      wrong: [
        "Minimal documentation to reduce administrative burden.",
        "Exclusion of technical personnel from decisions.",
        "Relying on informal agreements instead of contracts.",
      ],
    },
    {
      prompt: `A contracting professional in ${topic} must prioritize:`,
      correct: "Compliance with applicable regulations and fair treatment of offerors.",
      wrong: [
        "Maximizing personal convenience in process design.",
        "Limiting competition to known contractors.",
        "Avoiding written records of key decisions.",
      ],
    },
    {
      prompt: `When handling ${topic} matters, the FAR emphasizes:`,
      correct: "Competition, transparency, and accountability.",
      wrong: [
        "Restricting information to minimize oversight.",
        "Excluding small businesses from opportunities.",
        "Prioritizing speed over proper procedures.",
      ],
    },
  ];

  for (let i = 0; i < count; i++) {
    const p = patterns[i % patterns.length];
    const choices = [p.correct, ...p.wrong];
    const shuffled = shuffleArray([0, 1, 2, 3]);
    const correctIdx = shuffled.indexOf(0);
    const finalChoices = shuffled.map((idx) => choices[idx]) as [
      string,
      string,
      string,
      string,
    ];

    questions.push({
      prompt: p.prompt.replace(/\$\{terms\[.*?\]\}/g, terms[Math.floor(Math.random() * terms.length)]),
      choices: finalChoices,
      correctIndex: correctIdx,
      explanation: `In ${topic}, the correct approach aligns with FAR principles of transparency, competition, and proper documentation. The other options either violate ethical standards or procedural requirements.`,
      session,
      topic,
      tags: ["Representative Practice"],
      farRefs: ["FAR Part 1"],
      difficulty: 1 + (i % 5),
      source: "Generated",
    });
  }
  return questions;
}

function generateManualQuestions(): SeedQuestion[] {
  return [
    {
      prompt:
        "What is the primary purpose of the Federal Acquisition Regulation (FAR)?",
      choices: [
        "To provide uniform policies and procedures for acquisition by all executive agencies.",
        "To restrict competition to a limited pool of contractors.",
        "To eliminate the need for contracting officer oversight.",
        "To maximize profits for government contractors.",
      ],
      correctIndex: 0,
      explanation:
        "The FAR establishes uniform policies and procedures for acquisition by all executive agencies, ensuring consistency and fairness in federal contracting.",
      session: "Session 1",
      topic: "Contract Principles",
      tags: ["Representative Practice"],
      farRefs: ["FAR 1.101"],
      difficulty: 1,
    },
    {
      prompt:
        "Which of the following best describes the role of a Contracting Officer (CO)?",
      choices: [
        "The CO has the authority to enter into, administer, or terminate contracts on behalf of the Government.",
        "The CO serves only in an advisory capacity with no binding authority.",
        "The CO delegates all authority to program managers.",
        "The CO focuses exclusively on price negotiations.",
      ],
      correctIndex: 0,
      explanation:
        "A Contracting Officer is a person with the authority to enter into, administer, and/or terminate contracts and make related determinations and findings on behalf of the Government.",
      session: "Session 1",
      topic: "Skills and Roles",
      tags: ["Representative Practice"],
      farRefs: ["FAR 2.101"],
      difficulty: 1,
    },
    {
      prompt:
        "What is the significance of the Standards of Conduct for government employees?",
      choices: [
        "They ensure employees act with integrity and avoid conflicts of interest.",
        "They are optional guidelines with no legal force.",
        "They apply only to senior executives.",
        "They prohibit all contact with industry.",
      ],
      correctIndex: 0,
      explanation:
        "Standards of Conduct require federal employees to act with integrity, avoid conflicts of interest, and maintain public trust in government operations.",
      session: "Session 1",
      topic: "Standards of Conduct",
      tags: ["Representative Practice"],
      farRefs: ["5 CFR Part 2635"],
      difficulty: 2,
    },
    {
      prompt:
        "When should a Contracting Officer document the rationale for a sole source award?",
      choices: [
        "Before issuing the contract, with a written justification and approval.",
        "Only if the contractor requests it.",
        "After contract performance is complete.",
        "Sole source awards do not require documentation.",
      ],
      correctIndex: 0,
      explanation:
        "A written Justification and Approval (J&A) is required before a sole source contract can be awarded, documenting why full and open competition is not feasible.",
      session: "Session 2",
      topic: "Contract Principles",
      tags: ["Representative Practice"],
      farRefs: ["FAR 6.303"],
      difficulty: 2,
    },
    {
      prompt:
        "What is the purpose of a Source Selection Plan (SSP)?",
      choices: [
        "It outlines the evaluation approach, criteria, and process before solicitation release.",
        "It is prepared only after proposals are received.",
        "It replaces the need for evaluation documentation.",
        "It is required only for small purchases.",
      ],
      correctIndex: 0,
      explanation:
        "The SSP documents the evaluation approach, criteria, and process before the solicitation is released to ensure a fair and consistent evaluation.",
      session: "Session 2",
      topic: "Source Selection",
      tags: ["Representative Practice"],
      farRefs: ["FAR 15.303"],
      difficulty: 3,
    },
    {
      prompt:
        "In price or cost analysis, what is the purpose of verifying proposed costs?",
      choices: [
        "To ensure the Government pays a fair and reasonable price.",
        "To minimize contractor profit regardless of reasonableness.",
        "To eliminate all negotiation with offerors.",
        "Cost verification is not required for fixed-price contracts.",
      ],
      correctIndex: 0,
      explanation:
        "Price or cost analysis verifies that proposed costs are fair and reasonable, ensuring the Government receives value and contractors are compensated appropriately.",
      session: "Session 3",
      topic: "Price/Cost Analysis",
      tags: ["Representative Practice"],
      farRefs: ["FAR 15.404"],
      difficulty: 3,
    },
    {
      prompt:
        "What should a Contracting Officer do when a contractor disputes a Government claim?",
      choices: [
        "Follow the dispute resolution procedures in the contract and FAR.",
        "Ignore the dispute and proceed with contract closeout.",
        "Immediately terminate the contract.",
        "Refer all disputes to the contractor's attorney only.",
      ],
      correctIndex: 0,
      explanation:
        "The FAR and contract clauses establish procedures for resolving disputes, including the Contract Disputes Act process.",
      session: "Session 3",
      topic: "Disagreements",
      tags: ["Representative Practice"],
      farRefs: ["FAR 33.2"],
      difficulty: 2,
    },
    {
      prompt:
        "What is a key responsibility during contract administration?",
      choices: [
        "Monitoring contractor performance and ensuring compliance with contract terms.",
        "Avoiding all contact with the contractor after award.",
        "Delegating all administration to the contractor.",
        "Modifying the contract without documentation.",
      ],
      correctIndex: 0,
      explanation:
        "Contract administration involves monitoring performance, ensuring compliance, and maintaining proper documentation of all contract-related actions.",
      session: "Session 4",
      topic: "Administer Contract",
      tags: ["Representative Practice"],
      farRefs: ["FAR 42.302"],
      difficulty: 2,
    },
    {
      prompt:
        "When is a contract modification required?",
      choices: [
        "Whenever there is a change in the scope, price, or terms of the contract.",
        "Only for increases over $1 million.",
        "Modifications are optional for all changes.",
        "Only at the request of the contractor.",
      ],
      correctIndex: 0,
      explanation:
        "A contract modification (e.g., supplemental agreement or change order) is required whenever there is a bilateral or unilateral change to contract terms.",
      session: "Session 4",
      topic: "Manage Changes",
      tags: ["Representative Practice"],
      farRefs: ["FAR 43.102"],
      difficulty: 2,
    },
    {
      prompt:
        "What is the purpose of contract closeout?",
      choices: [
        "To settle all matters and ensure no outstanding obligations remain.",
        "To extend the contract indefinitely.",
        "Closeout is optional and can be skipped.",
        "To transfer all files to the contractor.",
      ],
      correctIndex: 0,
      explanation:
        "Contract closeout settles all matters, disposes of property, and ensures no outstanding obligations remain between the parties.",
      session: "Session 4",
      topic: "Closeout",
      tags: ["Representative Practice"],
      farRefs: ["FAR 4.804"],
      difficulty: 1,
    },
  ];
}

function main() {
  const allQuestions: SeedQuestion[] = [...generateManualQuestions()];

  let qid = 1;
  for (const session of SESSIONS) {
    const topics = SESSION_TOPICS[session] || TOPICS.slice(0, 4);
    for (const topic of topics) {
      const count = 14; // ~14 per topic to reach 220+
      const qs = generateTopicQuestions(session, topic, count);
      allQuestions.push(...qs);
      qid += qs.length;
    }
  }

  // Ensure unique prompts
  const seen = new Set<string>();
  const unique = allQuestions.filter((q) => {
    const key = q.prompt.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ensure we have 220+
  while (unique.length < 220) {
    const session =
      SESSIONS[Math.floor(Math.random() * SESSIONS.length)];
    const topics = SESSION_TOPICS[session];
    const topic =
      topics[Math.floor(Math.random() * topics.length)];
    const extra = generateTopicQuestions(session, topic, 1);
    for (const q of extra) {
      const key = q.prompt.slice(0, 80);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(q);
      }
    }
  }

  const outputPath = path.join(
    process.cwd(),
    "data",
    "questions.seed.json"
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));
  console.log(`Generated ${unique.length} questions to ${outputPath}`);
}

main();
