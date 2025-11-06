import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Update drawing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      drawingNumber,
      title,
      revision,
      fleetTypeName,
      diagramImage,
      aircraftRegistrations,
    } = body;

    // Handle fleet type
    let finalFleetTypeId: number | undefined;

    if (fleetTypeName) {
      // Check if fleet type already exists, if not create it
      let fleetType = await prisma.fleetType.findUnique({
        where: { name: fleetTypeName },
      });

      if (!fleetType) {
        // Create new fleet type with just name
        fleetType = await prisma.fleetType.create({
          data: {
            name: fleetTypeName,
            manufacturer: "",
            model: "",
          },
        });
      }

      finalFleetTypeId = fleetType.id;
    }

    const drawing = await prisma.drawing.update({
      where: { id: parseInt(id) },
      data: {
        ...(drawingNumber && { drawingNumber }),
        ...(title && { title }),
        ...(revision && { revision }),
        ...(finalFleetTypeId && { fleetTypeId: finalFleetTypeId }),
        ...(diagramImage !== undefined && {
          diagramImage: diagramImage || null,
        }),
      },
      include: {
        fleetType: true,
      },
    });

    // Process aircraft registrations if provided
    if (aircraftRegistrations !== undefined) {
      const newRegistrations = aircraftRegistrations
        .split(",")
        .map((reg: string) => reg.trim().toUpperCase())
        .filter((reg: string) => reg.length > 0);

      // Get current aircraft for this drawing
      const currentAircraft = await prisma.aircraft.findMany({
        where: { drawingId: parseInt(id) },
        select: { registration: true },
      });

      const currentRegistrations = currentAircraft.map((a) => a.registration);

      // Remove aircraft that are no longer in the list
      const toRemove = currentRegistrations.filter(
        (reg) => !newRegistrations.includes(reg)
      );
      if (toRemove.length > 0) {
        // First, get the aircraft IDs that will be unassigned
        const aircraftToUnassign = await prisma.aircraft.findMany({
          where: {
            registration: { in: toRemove },
            drawingId: parseInt(id),
          },
          select: { id: true, registration: true },
        });

        // Delete all equipment for these aircraft
        for (const aircraft of aircraftToUnassign) {
          await prisma.aircraftEquipment.deleteMany({
            where: { aircraftId: aircraft.id },
          });
          console.log(
            `Deleted equipment for aircraft ${aircraft.registration} (unassigned from drawing)`
          );
        }

        // Then unassign the aircraft from the drawing
        await prisma.aircraft.updateMany({
          where: {
            registration: { in: toRemove },
            drawingId: parseInt(id),
          },
          data: {
            drawingId: null,
          },
        });
      }

      // Add or update aircraft in the new list
      for (const registration of newRegistrations) {
        const existingAircraft = await prisma.aircraft.findUnique({
          where: { registration },
        });

        let aircraftId: number;

        if (existingAircraft) {
          // Update existing aircraft
          const updated = await prisma.aircraft.update({
            where: { registration },
            data: {
              ...(finalFleetTypeId && { fleetTypeId: finalFleetTypeId }),
              drawingId: parseInt(id),
            },
          });
          aircraftId = updated.id;
        } else {
          // Create new aircraft with default MSN
          const created = await prisma.aircraft.create({
            data: {
              registration,
              msn: "Data not available",
              fleetTypeId: finalFleetTypeId || drawing.fleetTypeId,
              drawingId: parseInt(id),
            },
          });
          aircraftId = created.id;
        }

        // AUTO-SYNC: Create/update equipment from drawing locations
        // Delete existing equipment for this aircraft
        await prisma.aircraftEquipment.deleteMany({
          where: { aircraftId },
        });

        // Get all locations from this drawing
        const locations = await prisma.equipmentLocation.findMany({
          where: { drawingId: parseInt(id) },
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

    return NextResponse.json(drawing);
  } catch (error: any) {
    console.error("Error updating drawing:", error);
    return NextResponse.json(
      {
        error: "Failed to update drawing",
        details: error.message || error,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete drawing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const drawing = await prisma.drawing.findUnique({
      where: { id: parseInt(id) },
      include: {
        aircraft: {
          include: {
            equipment: true,
          },
        },
        locations: true,
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    // Delete cascade order:
    // 1. Aircraft deletion will cascade to AircraftEquipment (onDelete: Cascade)
    // 2. Drawing deletion will cascade to EquipmentLocation (onDelete: Cascade)

    // Delete all aircraft associated with this drawing
    // (their equipment will be automatically deleted via cascade)
    if (drawing.aircraft.length > 0) {
      await prisma.aircraft.deleteMany({
        where: { drawingId: parseInt(id) },
      });
    }

    // Delete the drawing (equipment locations will be automatically deleted via cascade)
    await prisma.drawing.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return NextResponse.json(
      { error: "Failed to delete drawing" },
      { status: 500 }
    );
  }
}
