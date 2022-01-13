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
      create: [
        {
          firstName: "Nick",
          lastName: "Smyth",
          marketingOptIn: true,
          active: true,
          company: {
            create: {
              name: "Coca Cola",
            },
          },
        },
        {
          firstName: "Simon",
          lastName: "Jaff",
          marketingOptIn: true,
          active: false,
          company: {
            create: {
              name: "Legal Co",
            },
          },
        },
      ],
    },
  },
  {
    name: "Sarah",
    username: "sarah",
    email: "sarah@cerbos.demo",
    role: "user",
    department: "Sales",
    contacts: {
      create: [
        {
          firstName: "Mary",
          lastName: "Jane",
          active: true,
          marketingOptIn: false,
          company: {
            create: {
              name: "Pepsi Co",
            },
          },
        },
        {
          firstName: "Christina",
          lastName: "Baker",
          marketingOptIn: true,
          active: false,
          company: {
            create: {
              name: "Capri Sun",
            },
          },
        },
        {
          firstName: "Aleks",
          lastName: "Kozlov",
          marketingOptIn: true,
          active: true,
          company: {
            create: {
              name: "Pepsi Co",
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
