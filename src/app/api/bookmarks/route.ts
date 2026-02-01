import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/shuffle";

export async function GET(request: NextRequest) {
  try {
    const shuffleParam = request.nextUrl.searchParams.get("shuffle");
    const doShuffle = shuffleParam !== "false";

    const bookmarked = await prisma.progress.findMany({
      where: { isBookmarked: true },
      include: { question: true },
    });

    const items = bookmarked.map((p) => ({
      id: p.question.id,
      prompt: p.question.prompt,
      choices: JSON.parse(p.question.choices) as string[],
      correctIndex: p.question.correctIndex,
      explanation: p.question.explanation,
      session: p.question.session,
      topic: p.question.topic,
    }));

    const final = doShuffle ? shuffle(items) : items;
    return NextResponse.json(final);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}
