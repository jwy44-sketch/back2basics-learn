import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

export async function GET(request: NextRequest) {
  try {
    const shuffleParam = request.nextUrl.searchParams.get("shuffle");
    const doShuffle = shuffleParam !== "false";

    const progressWithWrong = await prisma.progress.findMany({
      where: { incorrectCount: { gt: 0 } },
      include: { question: true },
      orderBy: { incorrectCount: "desc" },
    });

    const items = progressWithWrong.map((p) => ({
      id: p.question.id,
      prompt: p.question.prompt,
      choices: JSON.parse(p.question.choices) as string[],
      correctIndex: p.question.correctIndex,
      explanation: p.question.explanation,
      session: p.question.session,
      topic: p.question.topic,
      incorrectCount: p.incorrectCount,
    }));

    const final = doShuffle ? shuffle(items) : items;
    return NextResponse.json(final);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch wrong answers" },
      { status: 500 }
    );
  }
}
