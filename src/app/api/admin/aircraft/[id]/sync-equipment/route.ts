import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Sync equipment from drawing template for existing aircraft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aircraftId = parseInt(id);

    // Get aircraft with drawing
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
      include: { drawing: true },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 }
      );
    }

    if (!aircraft.drawingId) {
      return NextResponse.json(
        { error: "Aircraft has no drawing assigned" },
        { status: 400 }
      );
    }

    // Delete existing equipment for this aircraft
    await prisma.aircraftEquipment.deleteMany({
      where: { aircraftId },
    });

    // Get all locations from the drawing
    const locations = await prisma.equipmentLocation.findMany({
      where: { drawingId: aircraft.drawingId },
    });

    // Create equipment for each location
    let created = 0;
    for (const location of locations) {
      const functionLoc = location.templateFunctionLoc?.replace(
        "{REG}",
        aircraft.registration
      );

      await prisma.aircraftEquipment.create({
        data: {
          aircraftId: aircraft.id,
          locationId: location.id,
          equipmentTypeId: location.equipmentTypeId,
          functionLocation:
            functionLoc || `${location.zone}-${aircraft.registration}`,
          status: "Active",
        },
      });
      created++;
    }

    return NextResponse.json(
      {
        message: `Successfully synced ${created} equipment items`,
        count: created,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error syncing equipment:", error);
    return NextResponse.json(
      { error: "Failed to sync equipment" },
      { status: 500 }
    );
  }
}
