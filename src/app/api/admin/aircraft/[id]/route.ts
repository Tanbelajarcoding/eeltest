import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get single aircraft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: parseInt(id) },
      include: {
        fleetType: true,
        drawing: true,
        equipment: {
          include: {
            equipmentType: true,
            location: true,
          },
        },
      },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: "Aircraft not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Error fetching aircraft:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 }
    );
  }
}

// PATCH - Update aircraft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { registration, msn, fleetTypeId, drawingId } = body;

    // Get old aircraft data to check if drawing changed
    const oldAircraft = await prisma.aircraft.findUnique({
      where: { id: parseInt(id) },
      select: { drawingId: true },
    });

    const aircraft = await prisma.aircraft.update({
      where: { id: parseInt(id) },
      data: {
        ...(registration && { registration: registration.toUpperCase() }),
        ...(msn && { msn }),
        ...(fleetTypeId && { fleetTypeId: parseInt(fleetTypeId) }),
        ...(drawingId !== undefined && {
          drawingId: drawingId ? parseInt(drawingId) : null,
        }),
      },
      include: {
        fleetType: true,
        drawing: true,
      },
    });

    // AUTO-SYNC: If drawing changed, re-sync equipment
    const newDrawingId = drawingId ? parseInt(drawingId) : null;
    if (oldAircraft && oldAircraft.drawingId !== newDrawingId) {
      console.log(
        `Drawing changed for aircraft ${aircraft.registration}, auto-syncing equipment...`
      );

      // Delete existing equipment
      await prisma.aircraftEquipment.deleteMany({
        where: { aircraftId: aircraft.id },
      });

      // Create new equipment from drawing template
      if (newDrawingId) {
        const locations = await prisma.equipmentLocation.findMany({
          where: { drawingId: newDrawingId },
        });

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
        }
        console.log(
          `Synced ${locations.length} equipment items for aircraft ${aircraft.registration}`
        );
      }
    }

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Error updating aircraft:", error);
    return NextResponse.json(
      { error: "Failed to update aircraft" },
      { status: 500 }
    );
  }
}

// DELETE - Delete aircraft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.aircraft.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting aircraft:", error);
    return NextResponse.json(
      { error: "Failed to delete aircraft" },
      { status: 500 }
    );
  }
}
