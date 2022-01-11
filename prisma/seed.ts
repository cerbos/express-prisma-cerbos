import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    id: "user1",
    name: "Alice",
    username: "alice",
    email: "alice@cerbos.demo",
    role: "admin",
    department: "IT",
  },
  {
    id: "user2",
    name: "John",
    username: "john",
    email: "john@cerbos.demo",
    role: "user",
    department: "Sales",
    contacts: {
      connectOrCreate: {
        where: {
          id: "user3",
        },
        create: {
          id: "user3",
          ownerId: "user2",
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
    id: "user4",
    name: "Sarah",
    username: "sarah",
    email: "sarah@cerbos.demo",
    role: "user",
    department: "Sales",
    contacts: {
      connectOrCreate: [
        {
          where: {
            id: "user5",
          },
          create: {
            id: "user5",
            firstName: "Mary",
            lastName: "Jane",
            ownerId: "user4",
            company: {
              create: {
                name: "Pepsi Co",
              },
            },
          },
        },
        {
          where: {
            id: "user6",
          },
          create: {
            id: "user6",
            firstName: "Christina",
            ownerId: "user4",
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
    id: "user7",
    name: "Geri",
    username: "geri",
    email: "geri@cerbos.demo",
    role: "user",
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
