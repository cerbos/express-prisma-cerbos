import { PrismaClient } from "@prisma/client";
import express from "express";
import { Cerbos } from "cerbos";
import basicAuth from "express-basic-auth";

const prisma = new PrismaClient();
const app = express();
const cerbos = new Cerbos({
  hostname: "http://localhost:3592", // The Cerbos PDP instance
});

app.use(express.json());

// Swap out for your authentication provider of choice
app.use(
  basicAuth({
    users: {
      alice: "supersecret",
      john: "password1234",
      sarah: "asdfghjkl",
      geri: "pwd123",
    },
  })
);

const getUser = async (req: express.Request) => {
  const userAth: {
    user: string;
  } = (req as any).auth;
  return await prisma.user.findUnique({
    where: { username: userAth.user },
  });
};

// READ
app.get("/contacts/:id", async (req, res) => {
  // load the contact
  const contact = await prisma.contact.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  // Get the user
  const user = await getUser(req);
  if (!user) return res.status(404).json({ error: "User not found" });

  // check user is authorized
  const allowed = await cerbos.check({
    principal: {
      id: `${user.id}`,
      roles: [user.role],
      attr: {
        department: user.department,
      },
    },
    resource: {
      kind: "contact",
      instances: {
        [contact.id]: {
          attr: contact,
        },
      },
    },
    actions: ["read"],
  });

  // authorized for read action
  if (allowed.isAuthorized(`${contact.id}`, "read")) {
    return res.json(contact);
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

app.post("/contacts/new", async (req, res) => {
  // Get the user
  const user = await getUser(req);
  if (!user) return res.status(404).json({ error: "User not found" });

  // check user is authorized
  const allowed = await cerbos.check({
    principal: {
      id: `${user.id}`,
      roles: [user.role],
      attr: {
        department: user.department,
      },
    },
    resource: {
      kind: "contact",
      instances: {
        new: {},
      },
    },
    actions: ["create"],
  });

  // authorized for create action
  if (allowed.isAuthorized("new", "create")) {
    return res.json({ result: "Created contact" });
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

app.patch("/contacts/:id", async (req, res) => {
  // load the contact
  const contact = await prisma.contact.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  // Get the user
  const user = await getUser(req);
  if (!user) return res.status(404).json({ error: "User not found" });

  const allowed = await cerbos.check({
    principal: {
      id: `${user.id}`,
      roles: [user.role],
      attr: {
        department: user.department,
      },
    },
    resource: {
      kind: "contact",
      instances: {
        [contact.id]: {
          attr: contact,
        },
      },
    },
    actions: ["update"],
  });

  if (allowed.isAuthorized(req.params.id, "update")) {
    return res.json({
      result: `Updated contact ${req.params.id}`,
    });
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

// DELETE
app.delete("/contacts/:id", async (req, res) => {
  // load the contact
  const contact = await prisma.contact.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  // Get the user
  const user = await getUser(req);
  if (!user) return res.status(404).json({ error: "User not found" });

  const allowed = await cerbos.check({
    principal: {
      id: `${user.id}`,
      roles: [user.role],
      attr: {
        department: user.department,
      },
    },
    resource: {
      kind: "contact",
      instances: {
        [contact.id]: {
          attr: contact,
        },
      },
    },
    actions: ["delete"],
  });

  if (allowed.isAuthorized(req.params.id, "delete")) {
    prisma.contact.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.json({
      result: `Contact ${req.params.id} deleted`,
    });
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

const server = app.listen(3000, () =>
  console.log(`🚀 Server ready at: http://localhost:3000`)
);
