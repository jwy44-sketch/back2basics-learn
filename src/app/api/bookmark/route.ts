import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId required" },
        { status: 400 }
      );
    }

    const progress = await prisma.progress.findUnique({
      where: { questionId },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    const updated = await prisma.progress.update({
      where: { questionId },
      data: { isBookmarked: !progress.isBookmarked },
    });

    return NextResponse.json({ isBookmarked: updated.isBookmarked });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}
