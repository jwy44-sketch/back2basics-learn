import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const session = searchParams.get("session");
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search") || "";
    const shuffleParam = searchParams.get("shuffle");
    const doShuffle = shuffleParam !== "false";

    const where: Record<string, unknown> = {};

    if (session) where.session = session;
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = parseInt(difficulty, 10);
    if (search.trim()) {
      where.prompt = { contains: search.trim() };
    }

    const questions = await prisma.question.findMany({
      where: Object.keys(where).length ? where : undefined,
    });

    let items = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      session: q.session,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    if (doShuffle) items = shuffle(items);

    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
