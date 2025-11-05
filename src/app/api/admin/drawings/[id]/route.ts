import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get single drawing with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const drawing = await prisma.drawing.findUnique({
      where: { id: parseInt(id) },
      include: {
        fleetType: true,
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawing" },
      { status: 500 }
    );
  }
}
