import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInitialProficiency, getNextDueOffsetMs } from "@/lib/spacedRepetition";

interface ImportQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
  tags?: string[];
  farRefs?: string[];
  difficulty?: number;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const questions: ImportQuestion[] = JSON.parse(text);

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid format: expected JSON array" },
        { status: 400 }
      );
    }

    const now = new Date();
    const initialProficiency = getInitialProficiency();
    const nextDueOffset = getNextDueOffsetMs(initialProficiency);

    let imported = 0;
    for (const q of questions) {
      if (
        !q.prompt ||
        !Array.isArray(q.choices) ||
        q.choices.length !== 4 ||
        q.correctIndex === undefined
      )
        continue;

      const existing = await prisma.question.findFirst({
        where: { prompt: q.prompt },
      });
      if (existing) continue;

      const question = await prisma.question.create({
        data: {
          prompt: q.prompt,
          choices: JSON.stringify(q.choices),
          correctIndex: q.correctIndex,
          explanation: q.explanation || "",
          session: q.session || "Session 1",
          topic: q.topic || "General",
          tags: JSON.stringify(q.tags || ["Representative Practice"]),
          farRefs: JSON.stringify(q.farRefs || ["FAR Part 1"]),
          difficulty: q.difficulty ?? 1,
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
      imported++;
    }

    return NextResponse.json({ imported, total: questions.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Import failed: " + (e instanceof Error ? e.message : "Unknown") },
      { status: 500 }
    );
  }
}
