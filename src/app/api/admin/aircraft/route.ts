import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - List all aircraft
export async function GET() {
  try {
    const aircraft = await prisma.aircraft.findMany({
      include: {
        fleetType: true,
        drawing: true,
        _count: {
          select: { equipment: true },
        },
      },
      orderBy: {
        registration: "asc",
      },
    });

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error("Error fetching aircraft:", error);
    return NextResponse.json(
      { error: "Failed to fetch aircraft" },
      { status: 500 }
    );
  }
}

// POST - Create new aircraft
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { registration, msn, fleetTypeId, drawingId } = body;

    if (!registration || !msn || !fleetTypeId) {
      return NextResponse.json(
        { error: "Registration, MSN, and Fleet Type are required" },
        { status: 400 }
      );
    }

    // Check if registration already exists
    const existing = await prisma.aircraft.findUnique({
      where: { registration: registration.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Aircraft with this registration already exists" },
        { status: 400 }
      );
    }

    // Create aircraft
    const aircraft = await prisma.aircraft.create({
      data: {
        registration: registration.toUpperCase(),
        msn,
        fleetTypeId: parseInt(fleetTypeId),
        drawingId: drawingId ? parseInt(drawingId) : null,
      },
      include: {
        fleetType: true,
        drawing: true,
      },
    });

    // Auto-create equipment from drawing template
    if (drawingId) {
      const locations = await prisma.equipmentLocation.findMany({
        where: { drawingId: parseInt(drawingId) },
      });

      for (const location of locations) {
        const functionLoc = location.templateFunctionLoc?.replace(
          "{REG}",
          registration.toUpperCase()
        );

        await prisma.aircraftEquipment.create({
          data: {
            aircraftId: aircraft.id,
            locationId: location.id,
            equipmentTypeId: location.equipmentTypeId,
            functionLocation:
              functionLoc || `${location.zone}-${registration.toUpperCase()}`,
            status: "Active",
          },
        });
      }
    }

    return NextResponse.json(aircraft, { status: 201 });
  } catch (error) {
    console.error("Error creating aircraft:", error);
    return NextResponse.json(
      { error: "Failed to create aircraft" },
      { status: 500 }
    );
  }
}
