import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drawings = await prisma.drawing.findMany({
      orderBy: { drawingNumber: "asc" },
      select: {
        id: true,
        drawingNumber: true,
        title: true,
        revision: true,
      },
    });

    return NextResponse.json(drawings);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawings" },
      { status: 500 }
    );
  }
}
