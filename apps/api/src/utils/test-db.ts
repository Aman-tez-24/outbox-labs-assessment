import { prisma } from "../config/prisma.js";

async function main() {
  const users = await prisma.user.count();

  console.log(`Database connected successfully.`);
  console.log(`Users: ${users}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });