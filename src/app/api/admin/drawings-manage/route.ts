import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Create new drawing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      drawingNumber,
      title,
      revision,
      fleetTypeName,
      diagramImage,
      aircraftRegistrations,
    } = body;

    if (!drawingNumber || !title || !revision || !fleetTypeName) {
      return NextResponse.json(
        {
          error: "Drawing Number, Title, Revision, and Fleet Type are required",
        },
        { status: 400 }
      );
    }

    // Check if fleet type already exists, if not create it
    let fleetType = await prisma.fleetType.findUnique({
      where: { name: fleetTypeName },
    });

    if (!fleetType) {
      // Create new fleet type with just name (manufacturer and model can be empty)
      fleetType = await prisma.fleetType.create({
        data: {
          name: fleetTypeName,
          manufacturer: "",
          model: "",
        },
      });
    }

    const finalFleetTypeId = fleetType.id;

    // Check if drawing number already exists
    const existing = await prisma.drawing.findUnique({
      where: { drawingNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Drawing with this number already exists" },
        { status: 400 }
      );
    }

    const drawing = await prisma.drawing.create({
      data: {
        drawingNumber,
        title,
        revision,
        fleetTypeId: finalFleetTypeId,
        diagramImage: diagramImage || null,
      },
      include: {
        fleetType: true,
      },
    });

    // Process aircraft registrations if provided
    if (aircraftRegistrations && aircraftRegistrations.trim()) {
      const registrations = aircraftRegistrations
        .split(",")
        .map((reg: string) => reg.trim().toUpperCase())
        .filter((reg: string) => reg.length > 0);

      // Get drawing locations for auto-sync
      const locations = await prisma.equipmentLocation.findMany({
        where: { drawingId: drawing.id },
      });

      // Create or update aircraft for each registration
      for (const registration of registrations) {
        // Check if aircraft already exists
        const existingAircraft = await prisma.aircraft.findUnique({
          where: { registration },
        });

        let aircraftId: number;

        if (existingAircraft) {
          // Update existing aircraft to use this drawing
          const updated = await prisma.aircraft.update({
            where: { registration },
            data: {
              fleetTypeId: finalFleetTypeId,
              drawingId: drawing.id,
            },
          });
          aircraftId = updated.id;
        } else {
          // Create new aircraft with default MSN
          const created = await prisma.aircraft.create({
            data: {
              registration,
              msn: "Data not available",
              fleetTypeId: finalFleetTypeId,
              drawingId: drawing.id,
            },
          });
          aircraftId = created.id;
        }

        // AUTO-SYNC: Create equipment from drawing locations
        // Delete existing equipment for this aircraft (in case of update)
        await prisma.aircraftEquipment.deleteMany({
          where: { aircraftId },
        });

        // Create equipment for each location
        for (const location of locations) {
          const functionLoc = location.templateFunctionLoc?.replace(
            "{REG}",
            registration
          );

          await prisma.aircraftEquipment.create({
            data: {
              aircraftId,
              locationId: location.id,
              equipmentTypeId: location.equipmentTypeId,
              functionLocation:
                functionLoc || `${location.zone}-${registration}`,
              status: "Active",
            },
          });
        }

        console.log(
          `Auto-synced ${locations.length} equipment items for aircraft ${registration}`
        );
      }
    }

    return NextResponse.json(drawing, { status: 201 });
  } catch (error) {
    console.error("Error creating drawing:", error);
    return NextResponse.json(
      { error: "Failed to create drawing" },
      { status: 500 }
    );
  }
}
