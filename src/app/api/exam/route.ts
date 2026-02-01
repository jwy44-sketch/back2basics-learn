import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

const PRESETS = [
  "All Sessions Mixed",
  "Session 1 Only",
  "Session 2 Only",
  "Session 3 Only",
  "Session 4 Only",
  "Weak Areas Only",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count, preset } = body;

    const targetCount = [10, 25, 50].includes(Number(count))
      ? Number(count)
      : 25;
    const presetName =
      PRESETS.includes(preset) || preset === "Weak Areas Only"
        ? preset
        : "All Sessions Mixed";

    let questions: { id: string; prompt: string; choices: string; correctIndex: number; explanation: string; session: string; topic: string }[] = [];

    if (presetName === "Weak Areas Only") {
      const progressWithWrong = await prisma.progress.findMany({
        where: { incorrectCount: { gt: 0 } },
        include: { question: true },
        orderBy: { incorrectCount: "desc" },
      });
      questions = progressWithWrong.map((p) => p.question);
    } else if (presetName === "All Sessions Mixed") {
      questions = await prisma.question.findMany();
    } else {
      const sessionMap: Record<string, string> = {
        "Session 1 Only": "Session 1",
        "Session 2 Only": "Session 2",
        "Session 3 Only": "Session 3",
        "Session 4 Only": "Session 4",
      };
      const session = sessionMap[presetName];
      questions = await prisma.question.findMany({
        where: { session },
      });
    }

    const shuffled = shuffle(questions);
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    const items = selected.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      session: q.session,
      topic: q.topic,
    }));

    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to build exam" },
      { status: 500 }
    );
  }
}
