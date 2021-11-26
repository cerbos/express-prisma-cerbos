import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    username: "alice",
    email: "alice@cerbos.demo",
    role: "admin",
    department: "IT",
  },
  {
    name: "John",
    username: "john",
    email: "john@cerbos.demo",
    role: "user",
    department: "Sales",
    contacts: {
      connectOrCreate: {
        where: {
          id: 1,
        },
        create: {
          firstName: "John",
          lastName: "Smith",
          company: {
            create: {
              name: "Coca Cola",
            },
          },
        },
      },
    },
  },
  {
    name: "Sarah",
    username: "sarah",
    email: "sarah@cerbos.demo",
    role: "user",
    department: "Sales",
    contacts: {
      connectOrCreate: [
        {
          where: {
            id: 2,
          },
          create: {
            firstName: "Mary",
            lastName: "Jane",
            company: {
              create: {
                name: "Pepsi Co",
              },
            },
          },
        },
        {
          where: {
            id: 3,
          },
          create: {
            firstName: "Christina",
            lastName: "Baker",
            company: {
              create: {
                name: "Capri Sun",
              },
            },
          },
        },
      ],
    },
  },
  {
    name: "Geri",
    username: "geri",
    email: "geri@cerbos.demo",
    role: "manager",
    department: "Marketing",
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
