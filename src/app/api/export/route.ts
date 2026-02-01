import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { session: "asc" },
    });

    const exportData = questions.map((q) => ({
      prompt: q.prompt,
      choices: JSON.parse(q.choices) as string[],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      session: q.session,
      topic: q.topic,
      tags: JSON.parse(q.tags) as string[],
      farRefs: JSON.parse(q.farRefs) as string[],
      difficulty: q.difficulty,
      source: q.source,
    }));

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="questions-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
