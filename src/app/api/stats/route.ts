import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMastered } from "@/lib/spacedRepetition";

export async function GET() {
  try {
    const [progress, attempts, questions] = await Promise.all([
      prisma.progress.findMany(),
      prisma.attempt.findMany({ select: { topic: true, wasCorrect: true } }),
      prisma.question.count(),
    ]);

    const totalCorrect = progress.reduce((s, p) => s + p.correctCount, 0);
    const totalIncorrect = progress.reduce((s, p) => s + p.incorrectCount, 0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const accuracy =
      totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
    const masteredCount = progress.filter((p) =>
      isMastered(p.proficiency)
    ).length;

    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const a of attempts) {
      const t = topicMap.get(a.topic) || { correct: 0, total: 0 };
      t.total++;
      if (a.wasCorrect) t.correct++;
      topicMap.set(a.topic, t);
    }

    const topicStats = [...topicMap.entries()].map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      total: data.total,
    }));

    const weakTopics = topicStats
      .filter((t) => t.total >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return NextResponse.json({
      totalQuestions: questions,
      masteredCount,
      accuracy: Math.round(accuracy * 100) / 100,
      totalAttempts,
      weakTopics,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
