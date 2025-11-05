import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fleetTypes = await prisma.fleetType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(fleetTypes);
  } catch (error) {
    console.error("Error fetching fleet types:", error);
    return NextResponse.json(
      { error: "Failed to fetch fleet types" },
      { status: 500 }
    );
  }
}
