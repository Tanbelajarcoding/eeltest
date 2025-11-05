import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get equipment locations for a drawing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const locations = await prisma.equipmentLocation.findMany({
      where: { drawingId: parseInt(id) },
      include: {
        equipmentType: true,
      },
      orderBy: { zone: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST - Save all equipment locations for a drawing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { locations } = body;

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: "Locations array is required" },
        { status: 400 }
      );
    }

    const drawingId = parseInt(id);

    // First, delete all aircraft equipment that reference these locations
    const existingLocations = await prisma.equipmentLocation.findMany({
      where: { drawingId },
      select: { id: true },
    });

    const locationIds = existingLocations.map((loc) => loc.id);

    if (locationIds.length > 0) {
      await prisma.aircraftEquipment.deleteMany({
        where: {
          locationId: {
            in: locationIds,
          },
        },
      });
    }

    // Then delete the locations themselves
    await prisma.equipmentLocation.deleteMany({
      where: { drawingId },
    });

    // Create new locations
    const createdLocations = await Promise.all(
      locations.map((loc: any) => {
        console.log("Creating location:", {
          drawingId,
          equipmentTypeId: loc.equipmentTypeId,
          x: loc.x,
          y: loc.y,
          zone: loc.zone || null,
          templateFunctionLoc: loc.templateFunctionLoc || null,
          functionLocations:
            loc.functionLocations && loc.functionLocations.length > 0
              ? loc.functionLocations
              : null,
          alternatePartNumbers:
            loc.alternatePartNumbers && loc.alternatePartNumbers.length > 0
              ? loc.alternatePartNumbers
              : null,
        });

        return prisma.equipmentLocation.create({
          data: {
            drawingId,
            equipmentTypeId: loc.equipmentTypeId,
            x: loc.x,
            y: loc.y,
            zone: loc.zone || null,
            templateFunctionLoc: loc.templateFunctionLoc || null,
            functionLocations:
              loc.functionLocations && loc.functionLocations.length > 0
                ? (loc.functionLocations as any)
                : null,
            alternatePartNumbers:
              loc.alternatePartNumbers && loc.alternatePartNumbers.length > 0
                ? (loc.alternatePartNumbers as any)
                : null,
          } as any,
          include: {
            equipmentType: true,
          },
        });
      })
    );

    console.log("Successfully created locations:", createdLocations.length);

    // AUTO-SYNC: Re-create equipment for all aircraft using this drawing
    const aircraftWithThisDrawing = await prisma.aircraft.findMany({
      where: { drawingId },
      select: { id: true, registration: true },
    });

    console.log(
      `Auto-syncing equipment for ${aircraftWithThisDrawing.length} aircraft...`
    );

    for (const aircraft of aircraftWithThisDrawing) {
      // Delete existing equipment for this aircraft
      await prisma.aircraftEquipment.deleteMany({
        where: { aircraftId: aircraft.id },
      });

      // Create new equipment from updated locations
      for (const location of createdLocations) {
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
      }
      console.log(
        `Synced ${createdLocations.length} equipment items for aircraft ${aircraft.registration}`
      );
    }

    return NextResponse.json(createdLocations, { status: 201 });
  } catch (error) {
    console.error("Error saving locations:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error: "Failed to save locations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
