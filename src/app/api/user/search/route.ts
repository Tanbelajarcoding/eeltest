import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const registration = searchParams.get("registration");
  const msn = searchParams.get("msn");

  if (!registration && !msn) {
    return NextResponse.json(
      { error: "Registration or MSN required" },
      { status: 400 }
    );
  }

  try {
    // Search for aircraft with all related data - by registration or MSN
    const aircraft = await prisma.aircraft.findFirst({
      where: {
        OR: [
          { registration: registration?.toUpperCase() || "" },
          { msn: msn?.toUpperCase() || "" },
        ],
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
    // If aircraft has installed equipment, show that
    // Otherwise, show template locations from the drawing
    let equipmentMarkers: any[] = [];

    if (aircraft.equipment && aircraft.equipment.length > 0) {
      // Show actual installed equipment
      // Group equipment by location
      const groupedByLocation = aircraft.equipment.reduce((acc: any, eq) => {
        const locationKey = `${eq.location.x}-${eq.location.y}`;
        if (!acc[locationKey]) {
          acc[locationKey] = {
            id: locationKey,
            x: eq.location.x,
            y: eq.location.y,
            zone: eq.location.zone,
            equipment: [],
          };
        }

        // Get function locations from the location's functionLocations JSON field
        const locationData = eq.location as any;
        const locationFunctionLocs = locationData.functionLocations
          ? Array.isArray(locationData.functionLocations)
            ? locationData.functionLocations
            : []
          : [];
        // Get alternate part numbers from location
        const locationAlternates = locationData.alternatePartNumbers
          ? Array.isArray(locationData.alternatePartNumbers)
            ? locationData.alternatePartNumbers
            : []
          : [];

        acc[locationKey].equipment.push({
          id: eq.id.toString(),
          partNumber: eq.equipmentType.partNumber,
          description: eq.equipmentType.description,
          alternatePartNumbers: locationAlternates,
          quantity: 1,
          functionLocation:
            locationFunctionLocs.length > 0
              ? locationFunctionLocs.join(", ")
              : eq.functionLocation || "N/A",
          status: eq.status,
        });
        return acc;
      }, {});

      equipmentMarkers = Object.values(groupedByLocation);
    } else if (aircraft.drawing?.locations) {
      // Show template locations from drawing (equipment locations defined in editor)
      equipmentMarkers = aircraft.drawing.locations.map((loc: any) => {
        // Parse functionLocations from JSON
        const functionLocs = loc.functionLocations
          ? Array.isArray(loc.functionLocations)
            ? loc.functionLocations
            : []
          : [];

        // Parse alternatePartNumbers from JSON
        const alternates = loc.alternatePartNumbers
          ? Array.isArray(loc.alternatePartNumbers)
            ? loc.alternatePartNumbers
            : []
          : [];

        return {
          id: loc.id.toString(),
          x: loc.x,
          y: loc.y,
          zone: loc.zone,
          equipment: [
            {
              id: loc.id.toString(),
              partNumber: loc.equipmentType.partNumber,
              description: loc.equipmentType.description,
              alternatePartNumbers: alternates,
              quantity: 1,
              functionLocation:
                functionLocs.length > 0
                  ? functionLocs.join(", ")
                  : loc.templateFunctionLoc || "N/A",
              status: "TEMPLATE",
            },
          ],
        };
      });
    }

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
