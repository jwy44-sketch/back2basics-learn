import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import {
  getNextDueOffsetMs,
  getInitialProficiency,
} from "../src/lib/spacedRepetition";

const prisma = new PrismaClient();

interface SeedQuestion {
  prompt: string;
  choices: string[] | [string, string, string, string];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
  tags: string[];
  farRefs: string[];
  difficulty: number;
  source?: string;
}

function loadQuestions(): SeedQuestion[] {
  const mainPath = path.join(process.cwd(), "data", "questions.seed.json");
  const extraPath = path.join(process.cwd(), "data", "questions-extra.json");

  if (!fs.existsSync(mainPath)) {
    throw new Error(`Seed file not found: ${mainPath}`);
  }

  const main = JSON.parse(fs.readFileSync(mainPath, "utf-8")) as SeedQuestion[];
  let extra: SeedQuestion[] = [];
  if (fs.existsSync(extraPath)) {
    extra = JSON.parse(fs.readFileSync(extraPath, "utf-8")) as SeedQuestion[];
  }

  const seen = new Set<string>();
  const unique: SeedQuestion[] = [];
  for (const q of [...main, ...extra]) {
    const key = q.prompt.slice(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }
  return unique;
}

async function main() {
  console.log("Seeding database...");

  const questions = loadQuestions();
  console.log(`Loaded ${questions.length} questions`);

  if (questions.length < 200) {
    throw new Error(
      `Seed requires at least 200 questions, found ${questions.length}`
    );
  }

  await prisma.attempt.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.question.deleteMany();
  await prisma.resource.deleteMany();

  const now = new Date();
  const initialProficiency = getInitialProficiency();
  const nextDueOffset = getNextDueOffsetMs(initialProficiency);

  for (const q of questions) {
    const choices = Array.isArray(q.choices) ? q.choices : [];
    if (choices.length !== 4) continue;

    const question = await prisma.question.create({
      data: {
        prompt: q.prompt,
        choices: JSON.stringify(choices),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        session: q.session,
        topic: q.topic,
        tags: JSON.stringify(q.tags || ["Representative Practice"]),
        farRefs: JSON.stringify(q.farRefs || ["FAR Part 1"]),
        difficulty: q.difficulty || 1,
        source: q.source,
      },
    });

    await prisma.progress.create({
      data: {
        questionId: question.id,
        proficiency: initialProficiency,
        correctCount: 0,
        incorrectCount: 0,
        nextDueAt: new Date(now.getTime() + nextDueOffset),
        isBookmarked: false,
      },
    });
  }

  const resources = [
    { title: "A FAR Better View", url: "https://content1.dau.edu/GCON%20001%20A%20FAR%20better%20view_161/content/", category: "DAU" },
    { title: "Skills and Roles", url: "https://content1.dau.edu/unit-02-skills-and-roles-business-skills-and-acumen-current-raw-Ty5rpraP_61/content/", category: "DAU" },
    { title: "Communication and Documentation", url: "https://content1.dau.edu/unit-03-communication-and-documentation-current-raw-myU2QLQj_53/content/", category: "DAU" },
    { title: "Standards of Conduct", url: "https://content1.dau.edu/unit-04-standards-of-conduct-current-raw-BLPYhQyh_62/content/", category: "DAU" },
    { title: "Situational Assessment and Team Dynamics", url: "https://content1.dau.edu/unit-05-situational-assessment-and-team-dynamics-current-raw-0NeAWN-p_52/content/", category: "DAU" },
    { title: "Contract Principles", url: "https://content1.dau.edu/unit-06-contract-principles-current-raw-BGKvitNI_60/content/", category: "DAU" },
    { title: "Plan Solicitation", url: "https://content1.dau.edu/unit-08-plan-solicitation-current-raw-9NRcsW9H_63/content/", category: "DAU" },
    { title: "Request Offers", url: "https://content1.dau.edu/unit-09-request-offers-current-raw-1bvfEv1j_64/content/", category: "DAU" },
    { title: "Plan Sales and Prepare Offer", url: "https://content1.dau.edu/unit-10-plan-sales-and-prepare-offer-current-raw-vxRV5hJk_56/content/", category: "DAU" },
    { title: "Price or Cost Analysis", url: "https://content1.dau.edu/unit-12-price-or-cost-analysis-current-raw-PTFNLVme_new_73/content/", category: "DAU" },
    { title: "Plan Negotiations", url: "https://content1.dau.edu/unit-13-plan-negotiations-current-raw-7t9znx3Y_59/content/", category: "DAU" },
    { title: "Select Source", url: "https://content1.dau.edu/unit-14-select-source-current-raw-4phhTTTQ_55/content/", category: "DAU" },
    { title: "Manage Disagreements", url: "https://content1.dau.edu/unit-15-manage-disagreements-current-raw-a3pI8EGX_57/content/", category: "DAU" },
    { title: "Administer Contract", url: "https://content1.dau.edu/unit-18-administer-contract-current-raw-htQvVZwf_58/content/", category: "DAU" },
    { title: "Manage Changes", url: "https://content1.dau.edu/unit-19-manage-changes-current-raw-kGnf7g9K_54/content/", category: "DAU" },
    { title: "Ensure Quality", url: "https://content1.dau.edu/unit-20-ensure-quality-current-raw-2T8Qh0R2_51/content/", category: "DAU" },
    { title: "Manage Subcontracts", url: "https://content1.dau.edu/unit-22-manage-subcontracts-current-raw-8otqYl7f_50/content/", category: "DAU" },
    { title: "Close Out", url: "https://content1.dau.edu/unit-24-close-out-current-raw-Q_2M2D0U_49/content/", category: "DAU" },
  ];

  for (const r of resources) {
    await prisma.resource.create({ data: r });
  }

  console.log(`Seeded ${questions.length} questions and ${resources.length} resources`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
