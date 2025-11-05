import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get single equipment type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentType = await prisma.equipmentType.findUnique({
      where: { id: parseInt(id) },
      include: {
        locations: {
          include: {
            drawing: true,
          },
        },
        equipment: {
          include: {
            aircraft: true,
          },
        },
      },
    });

    if (!equipmentType) {
      return NextResponse.json(
        { error: "Equipment type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(equipmentType);
  } catch (error) {
    console.error("Error fetching equipment type:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment type" },
      { status: 500 }
    );
  }
}

// PATCH - Update equipment type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partNumber, description } = body;

    const equipmentType = await prisma.equipmentType.update({
      where: { id: parseInt(id) },
      data: {
        ...(partNumber && { partNumber: partNumber.toUpperCase() }),
        ...(description && { description }),
      },
    });

    return NextResponse.json(equipmentType);
  } catch (error) {
    console.error("Error updating equipment type:", error);
    return NextResponse.json(
      { error: "Failed to update equipment type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete equipment type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if equipment type is in use
    const equipmentType = await prisma.equipmentType.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { equipment: true, locations: true },
        },
      },
    });

    if (!equipmentType) {
      return NextResponse.json(
        { error: "Equipment type not found" },
        { status: 404 }
      );
    }

    if (
      equipmentType._count.equipment > 0 ||
      equipmentType._count.locations > 0
    ) {
      return NextResponse.json(
        { error: "Cannot delete equipment type that is in use" },
        { status: 400 }
      );
    }

    await prisma.equipmentType.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment type:", error);
    return NextResponse.json(
      { error: "Failed to delete equipment type" },
      { status: 500 }
    );
  }
}
