const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const grps = await prisma.cardGroup.findMany({ where: { categoryId: 3, name: { contains: '151' } } });
  console.log(grps);
}
run();
