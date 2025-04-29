// /home/hasbi/affiliate/scripts/fixNameParam.js

import prisma from "../src/lib/db/prisma"; // Adjust the import to match your file structure

async function main() {
  // Update 'name' parameter to be dynamic
  await prisma.parameter.updateMany({
    where: { id: "name", isDynamic: false },
    data: { isDynamic: true, source: "contact.name" },
  });
  console.log("✅ Updated 'name' parameter to dynamic");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect(); // Close Prisma connection after execution
  });
