import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  updateProficiency,
  getNextDueOffsetMs,
} from "@/lib/spacedRepetition";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, selectedIndex, mode } = body;

    if (!questionId || selectedIndex === undefined) {
      return NextResponse.json(
        { error: "questionId and selectedIndex required" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { progress: true },
    });

    if (!question || !question.progress) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const wasCorrect = selectedIndex === question.correctIndex;
    const progress = question.progress;
    const newProficiency = updateProficiency(progress.proficiency, wasCorrect);
    const nextDueOffset = getNextDueOffsetMs(newProficiency);
    const nextDueAt = new Date(Date.now() + nextDueOffset);

    await prisma.$transaction([
      prisma.progress.update({
        where: { id: progress.id },
        data: {
          proficiency: newProficiency,
          correctCount: { increment: wasCorrect ? 1 : 0 },
          incorrectCount: { increment: wasCorrect ? 0 : 1 },
          lastAnsweredAt: new Date(),
          nextDueAt,
        },
      }),
      prisma.attempt.create({
        data: {
          questionId,
          selectedIndex,
          wasCorrect,
          mode: mode || "learn",
          session: question.session,
          topic: question.topic,
        },
      }),
    ]);

    return NextResponse.json({
      wasCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      newProficiency,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
