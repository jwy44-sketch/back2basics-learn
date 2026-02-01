import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

export async function GET(request: NextRequest) {
  try {
    const shuffleParam = request.nextUrl.searchParams.get("shuffle");
    const doShuffle = shuffleParam !== "false"; // default true

    const now = new Date();

    // Due items: nextDueAt <= now or null
    const dueProgress = await prisma.progress.findMany({
      where: {
        OR: [{ nextDueAt: { lte: now } }, { nextDueAt: null }],
      },
      include: { question: true },
      orderBy: { proficiency: "asc" },
    });

    // If we have due items, use them. Else use lowest proficiency
    let queue = dueProgress;
    if (queue.length === 0) {
      queue = await prisma.progress.findMany({
        include: { question: true },
        orderBy: { proficiency: "asc" },
        take: 50,
      });
    }

    const items = queue.map((p) => ({
      id: p.question.id,
      prompt: p.question.prompt,
      choices: JSON.parse(p.question.choices) as string[],
      correctIndex: p.question.correctIndex,
      explanation: p.question.explanation,
      session: p.question.session,
      topic: p.question.topic,
      proficiency: p.proficiency,
    }));

    const final = doShuffle ? shuffle(items) : items;
    return NextResponse.json(final);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch learn queue" },
      { status: 500 }
    );
  }
}
