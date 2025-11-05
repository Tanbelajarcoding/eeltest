import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drawings = await prisma.drawing.findMany({
      include: {
        fleetType: true,
        aircraft: {
          select: {
            registration: true,
          },
          orderBy: {
            registration: "asc",
          },
        },
        _count: {
          select: {
            locations: true,
            aircraft: true,
          },
        },
      },
      orderBy: {
        drawingNumber: "asc",
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
