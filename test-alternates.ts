import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔍 Testing Alternate Part Numbers\n");

  // 1. Find equipment type for primary PN
  const primaryPN = "502761-409-2845";
  const equipmentType = await prisma.equipmentType.findFirst({
    where: { partNumber: primaryPN },
  });

  console.log("1️⃣ Primary Equipment Type:");
  console.log(equipmentType);

  // 2. Find all locations
  const allLocations = await prisma.equipmentLocation.findMany({
    include: { equipmentType: true },
  });

  console.log("\n2️⃣ Total Locations:", allLocations.length);

  // 3. Show locations with alternatePartNumbers
  console.log("\n3️⃣ Locations with alternatePartNumbers:");
  allLocations.forEach((loc) => {
    if (loc.alternatePartNumbers) {
      console.log(`  Location ID ${loc.id}:`);
      console.log(`    Primary PN: ${loc.equipmentType.partNumber}`);
      console.log(`    Alternates:`, loc.alternatePartNumbers);
      console.log(`    Type of alternates:`, typeof loc.alternatePartNumbers);
      console.log(`    Is Array?:`, Array.isArray(loc.alternatePartNumbers));

      if (Array.isArray(loc.alternatePartNumbers)) {
        console.log(
          `    Array contents:`,
          loc.alternatePartNumbers.map((a) => `"${a}"`).join(", ")
        );
      }
    }
  });

  // 4. Test the filter logic
  const searchPN = "502761-409-2845";
  console.log(`\n4️⃣ Testing filter for: ${searchPN}`);

  const relevantLocations = allLocations.filter((loc: any) => {
    if (loc.equipmentType.partNumber === searchPN) {
      console.log(`  ✅ Found as PRIMARY in location ${loc.id}`);
      return true;
    }
    if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
      const found = loc.alternatePartNumbers.includes(searchPN);
      if (found) {
        console.log(`  ✅ Found as ALTERNATE in location ${loc.id}`);
      }
      return found;
    }
    return false;
  });

  console.log(`\n  Result: ${relevantLocations.length} relevant locations`);

  // 5. Collect alternates
  const relatedPNs = new Set<string>();
  relevantLocations.forEach((loc: any) => {
    relatedPNs.add(loc.equipmentType.partNumber);
    if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
      loc.alternatePartNumbers.forEach((alt: string) => relatedPNs.add(alt));
    }
  });
  relatedPNs.delete(searchPN);

  console.log("\n5️⃣ Suggested alternates:", Array.from(relatedPNs));

  // 6. Test reverse (search by alternate PN)
  const alternatePN = "1027-2-011-8173";
  console.log(`\n6️⃣ Testing reverse search for: ${alternatePN}`);

  const reverseLocations = allLocations.filter((loc: any) => {
    if (loc.equipmentType.partNumber === alternatePN) {
      console.log(`  ✅ Found as PRIMARY in location ${loc.id}`);
      return true;
    }
    if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
      const found = loc.alternatePartNumbers.includes(alternatePN);
      if (found) {
        console.log(`  ✅ Found as ALTERNATE in location ${loc.id}`);
      }
      return found;
    }
    return false;
  });

  console.log(`\n  Result: ${reverseLocations.length} relevant locations`);

  const reverseRelatedPNs = new Set<string>();
  reverseLocations.forEach((loc: any) => {
    reverseRelatedPNs.add(loc.equipmentType.partNumber);
    if (loc.alternatePartNumbers && Array.isArray(loc.alternatePartNumbers)) {
      loc.alternatePartNumbers.forEach((alt: string) =>
        reverseRelatedPNs.add(alt)
      );
    }
  });
  reverseRelatedPNs.delete(alternatePN);

  console.log(
    "\n7️⃣ Suggested alternates (reverse):",
    Array.from(reverseRelatedPNs)
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
