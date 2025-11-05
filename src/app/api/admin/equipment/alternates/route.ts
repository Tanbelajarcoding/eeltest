import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get alternate part number suggestions based on primary part number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partNumber = searchParams.get("partNumber");

    if (!partNumber) {
      return NextResponse.json(
        { error: "Part number is required" },
        { status: 400 }
      );
    }

    const searchPartNumber = partNumber.toUpperCase();
    console.log("🔍 Searching alternates for:", searchPartNumber);

    // Find equipment type by part number
    const equipmentType = await prisma.equipmentType.findFirst({
      where: {
        partNumber: {
          equals: searchPartNumber,
        },
      },
    });
    console.log("📦 Equipment type found:", equipmentType?.partNumber);

    // Find ALL locations where this part number appears (either as primary or alternate)
    const allLocations = await prisma.equipmentLocation.findMany({
      include: {
        equipmentType: true,
      },
    });
    console.log("📍 Total locations in database:", allLocations.length);

    // Filter locations that contain the searched part number
    const relevantLocations = allLocations.filter((loc: any) => {
      // Check if it's the primary part number
      if (loc.equipmentType.partNumber === searchPartNumber) {
        console.log(
          "✅ Found as primary in location:",
          loc.id,
          "alternates:",
          loc.alternatePartNumbers
        );
        return true;
      }
      // Check if it's in alternates
      if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
        const found = loc.alternatePartNumbers.includes(searchPartNumber);
        if (found) {
          console.log(
            "✅ Found in alternates of location:",
            loc.id,
            "primary:",
            loc.equipmentType.partNumber
          );
        }
        return found;
      }
      return false;
    });
    console.log("🎯 Relevant locations found:", relevantLocations.length);

    if (relevantLocations.length === 0) {
      console.log("❌ No locations found with this part number");
      return NextResponse.json({
        partNumber: searchPartNumber,
        description: equipmentType?.description || "Unknown Equipment",
        alternates: [],
        equipmentTypes: [],
      });
    }

    // Collect all related part numbers (primary + alternates) from relevant locations
    const relatedPartNumbers = new Set<string>();

    relevantLocations.forEach((loc: any) => {
      // Add primary part number
      relatedPartNumbers.add(loc.equipmentType.partNumber);

      // Add all alternate part numbers
      if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
        loc.alternatePartNumbers.forEach((alt: string) => {
          relatedPartNumbers.add(alt);
        });
      }
    });

    // Remove the queried part number from suggestions
    relatedPartNumbers.delete(searchPartNumber);
    console.log("💡 Returning suggestions:", Array.from(relatedPartNumbers));

    // Get equipment types for these part numbers
    const suggestedEquipment = await prisma.equipmentType.findMany({
      where: {
        partNumber: {
          in: Array.from(relatedPartNumbers),
        },
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
      },
    });

    return NextResponse.json({
      partNumber: searchPartNumber,
      description:
        equipmentType?.description ||
        relevantLocations[0]?.equipmentType?.description ||
        "Unknown Equipment",
      alternates: Array.from(relatedPartNumbers),
      equipmentTypes: suggestedEquipment,
    });
  } catch (error) {
    console.error("Error fetching alternate suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch alternate suggestions" },
      { status: 500 }
    );
  }
}

// POST - Create/update equipment types for all alternate part numbers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryPartNumber, alternatePartNumbers, description } = body;

    if (!primaryPartNumber || !description) {
      return NextResponse.json(
        { error: "Primary part number and description are required" },
        { status: 400 }
      );
    }

    const results = {
      primary: null as any,
      alternates: [] as any[],
    };

    // Ensure primary part number exists as equipment type
    const primaryUpper = primaryPartNumber.toUpperCase();
    let primaryEquipment = await prisma.equipmentType.findUnique({
      where: { partNumber: primaryUpper },
    });

    if (!primaryEquipment) {
      primaryEquipment = await prisma.equipmentType.create({
        data: {
          partNumber: primaryUpper,
          description: description,
          category: "GENERAL",
        },
      });
    }
    results.primary = primaryEquipment;

    // Create equipment types for each alternate part number
    if (alternatePartNumbers && Array.isArray(alternatePartNumbers)) {
      for (const altPN of alternatePartNumbers) {
        const altUpper = altPN.trim().toUpperCase();
        if (!altUpper) continue;

        // Check if alternate already exists
        let altEquipment = await prisma.equipmentType.findUnique({
          where: { partNumber: altUpper },
        });

        if (!altEquipment) {
          // Create new equipment type with same description
          altEquipment = await prisma.equipmentType.create({
            data: {
              partNumber: altUpper,
              description: description,
              category: "GENERAL",
            },
          });
        } else if (altEquipment.description !== description) {
          // Update description if different
          altEquipment = await prisma.equipmentType.update({
            where: { partNumber: altUpper },
            data: { description: description },
          });
        }

        results.alternates.push(altEquipment);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error creating alternate equipment types:", error);
    return NextResponse.json(
      { error: "Failed to create alternate equipment types" },
      { status: 500 }
    );
  }
}
