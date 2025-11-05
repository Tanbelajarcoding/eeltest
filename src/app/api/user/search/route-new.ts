import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const registration = searchParams.get("registration");

  if (!registration) {
    return NextResponse.json(
      { error: "Registration required" },
      { status: 400 }
    );
  }

  try {
    // Search for aircraft with all related data
    const aircraft = await prisma.aircraft.findFirst({
      where: {
        registration: {
          equals: registration,
          mode: "insensitive",
        },
      },
      include: {
        fleetType: true,
        drawing: {
          include: {
            locations: {
              include: {
                equipmentType: true,
              },
            },
          },
        },
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

    // Transform equipment data to match InteractiveDiagram component format
    const equipmentMarkers = aircraft.equipment.map((eq) => ({
      id: eq.id,
      partNumber: eq.equipmentType.partNumber,
      description: eq.equipmentType.description,
      category: eq.equipmentType.category,
      functionLocation: eq.functionLocation,
      x: eq.location.x,
      y: eq.location.y,
      zone: eq.location.zone,
      status: eq.status,
      installDate: eq.installDate,
      remarks: eq.remarks,
      photo: eq.photo,
    }));

    return NextResponse.json({
      aircraft: {
        id: aircraft.id,
        registration: aircraft.registration,
        msn: aircraft.msn,
        fleetType: aircraft.fleetType?.name,
      },
      drawing: {
        drawingNumber: aircraft.drawing?.drawingNumber,
        title: aircraft.drawing?.title,
        revision: aircraft.drawing?.revision,
        diagramImage: aircraft.drawing?.diagramImage,
      },
      equipment: equipmentMarkers,
    });
  } catch (error) {
    console.error("Error searching aircraft:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
