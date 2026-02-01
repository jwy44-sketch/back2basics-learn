import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { title: "asc" },
    });
    return NextResponse.json(resources);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
