const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const trucks = [
    {
      id: "TRUCK_01",
      name: "Truck Alpha",
      status: "active",
      destLat: 13.7563,
      destLng: 100.5018,
    },
    {
      id: "TRUCK_02",
      name: "Truck Bravo",
      status: "active",
      destLat: 13.8621,
      destLng: 100.5132,
    },
    {
      id: "TRUCK_03",
      name: "Truck Charlie",
      status: "idle",
      destLat: 13.6908,
      destLng: 100.5904,
    },
  ];

  for (const truck of trucks) {
    await prisma.vehicle.upsert({
      where: { id: truck.id },
      update: {},
      create: truck,
    });
    console.log(`  Upserted vehicle: ${truck.id}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
