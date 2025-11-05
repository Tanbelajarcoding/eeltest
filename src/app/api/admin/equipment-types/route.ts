import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all equipment types
export async function GET() {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      orderBy: { partNumber: "asc" },
    });

    return NextResponse.json(equipmentTypes);
  } catch (error) {
    console.error("Error fetching equipment types:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment types" },
      { status: 500 }
    );
  }
}
