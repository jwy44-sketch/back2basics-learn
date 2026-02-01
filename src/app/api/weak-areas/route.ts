import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

export async function GET(request: NextRequest) {
  try {
    const shuffleParam = request.nextUrl.searchParams.get("shuffle");
    const doShuffle = shuffleParam !== "false";

    const questions = await prisma.question.findMany({
      include: { progress: true },
    });

    const topicAcc = new Map<
      string,
      { correct: number; incorrect: number; questions: typeof questions }
    >();

    for (const q of questions) {
      if (!q.progress) continue;
      const t = q.topic;
      if (!topicAcc.has(t)) {
        topicAcc.set(t, { correct: 0, incorrect: 0, questions: [] });
      }
      const acc = topicAcc.get(t)!;
      acc.correct += q.progress.correctCount;
      acc.incorrect += q.progress.incorrectCount;
      acc.questions.push(q);
    }

    const weakTopics = [...topicAcc.entries()]
      .map(([topic, data]) => ({
        topic,
        accuracy:
          data.correct + data.incorrect > 0
            ? data.correct / (data.correct + data.incorrect)
            : 1,
        incorrectCount: data.incorrect,
        questions: data.questions,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const weakest3 = weakTopics.slice(0, 3);
    const weakQuestionIds = new Set(
      weakest3.flatMap((t) => t.questions.map((q) => q.id))
    );

    const weakQs = weakest3.flatMap((t) => t.questions);
    const otherQs = questions.filter((q) => !weakQuestionIds.has(q.id));

    const weakCount = Math.ceil(weakQs.length * 0.7) || weakQs.length;
    const otherCount = Math.min(
      Math.ceil(weakQs.length * 0.3) || 10,
      otherQs.length
    );

    const weakSelected = shuffle(weakQs).slice(0, weakCount);
    const otherSelected = shuffle(otherQs).slice(0, otherCount);
    let combined = [...weakSelected, ...otherSelected];
    if (doShuffle) combined = shuffle(combined);

    const items = combined.map((q) => ({
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
      { error: "Failed to fetch weak areas" },
      { status: 500 }
    );
  }
}
