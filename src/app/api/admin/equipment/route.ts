import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all equipment types
export async function GET() {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      include: {
        locations: {
          select: {
            drawingId: true,
          },
        },
        equipment: {
          select: {
            aircraftId: true,
          },
          distinct: ["aircraftId"],
        },
      },
      orderBy: {
        partNumber: "asc",
      },
    });

    // Get ALL locations to check for alternate part numbers
    const allLocations = await prisma.equipmentLocation.findMany();

    // Transform to include unique drawing and aircraft counts
    const transformedData = equipmentTypes.map((eq) => {
      // Get unique drawing IDs from locations where this is PRIMARY
      const uniqueDrawingIds = new Set(
        eq.locations.map((loc) => loc.drawingId)
      );

      // Also check locations where this part number is in alternatePartNumbers
      allLocations.forEach((loc: any) => {
        if (
          loc.alternatePartNumbers &&
          Array.isArray(loc.alternatePartNumbers) &&
          loc.alternatePartNumbers.includes(eq.partNumber)
        ) {
          uniqueDrawingIds.add(loc.drawingId);
        }
      });

      return {
        id: eq.id,
        partNumber: eq.partNumber,
        description: eq.description,
        category: eq.category,
        createdAt: eq.createdAt,
        updatedAt: eq.updatedAt,
        _count: {
          locations: uniqueDrawingIds.size, // Count of unique drawings (primary + alternate)
          equipment: eq.equipment.length, // Count of unique aircraft (only primary, alternates don't create separate equipment)
        },
      };
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching equipment types:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment types" },
      { status: 500 }
    );
  }
}

// POST - Create new equipment type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partNumber, description } = body;

    if (!partNumber || !description) {
      return NextResponse.json(
        { error: "Part Number and Description are required" },
        { status: 400 }
      );
    }

    // Check if part number already exists
    const existing = await prisma.equipmentType.findUnique({
      where: { partNumber: partNumber.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Equipment type with this part number already exists" },
        { status: 400 }
      );
    }

    const equipmentType = await prisma.equipmentType.create({
      data: {
        partNumber: partNumber.toUpperCase(),
        description,
        category: "GENERAL", // Default category
      },
    });

    return NextResponse.json(equipmentType, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment type:", error);
    return NextResponse.json(
      { error: "Failed to create equipment type" },
      { status: 500 }
    );
  }
}
