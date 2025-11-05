import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalAircraft, totalDrawings, totalEquipmentTypes, totalUsers] =
      await Promise.all([
        prisma.aircraft.count(),
        prisma.drawing.count(),
        prisma.equipmentType.count(),
        prisma.user.count(),
      ]);

    return NextResponse.json({
      totalAircraft,
      totalDrawings,
      totalEquipmentTypes,
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
