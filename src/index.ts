import { PrismaClient, User } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { Cerbos } from "cerbos";
import basicAuth from "express-basic-auth";
import queryPlanToPrisma from "cerbos-orm-prisma";

declare global {
  namespace Express {
    interface Request {
      user: User;
      auth: {
        user: string;
      };
    }
  }
}

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

const cerbos = new Cerbos({
  hostname: "http://localhost:3592", // The Cerbos PDP instance
  logLevel: "debug",
});

const app = express();

app.use(express.json());

// Swap out for your authentication provider of choice
app.use(
  basicAuth({
    challenge: true,
    users: {
      alice: "password", // role: admin, department: IT
      john: "password", // role: user, department: Sales
      sarah: "password", // role: user, department: Sales
      geri: "password", // role: user, department: Markerting
    },
  })
);

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.auth.user },
    });
    if (!user) {
      throw Error("Not found");
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(404).json({ error: "User not found" });
  }
});

app.get("/contacts", async (req, res) => {
  // Fetch the query plan from Cerbos passing in the principal
  // resource type and action
  const contactQueryPlan = await cerbos.getQueryPlan({
    principal: {
      id: req.user.id,
      roles: [req.user.role],
      attr: {
        department: req.user.department,
      },
    },
    resource: {
      kind: "contact",
    },
    action: "read",
  });

  const filters = queryPlanToPrisma({
    queryPlan: contactQueryPlan,
    // map or function to change field names to match the prisma model
    fieldNameMapper: {
      "request.resource.attr.ownerId": "ownerId",
      "request.resource.attr.department": "department",
      "request.resource.attr.active": "active",
      "request.resource.attr.marketingOptIn": "marketingOptIn",
    },
  });

  // Pass the filters in as where conditions
  // If you have prexisting where conditions, you can pass them in an AND clause
  const contacts = await prisma.contact.findMany({
    where: filters,
    select: {
      firstName: true,
      lastName: true,
      active: true,
      marketingOptIn: true,
    },
  });

  if (req.query.debug) {
    return res.json({
      contacts,
      principal: {
        id: req.user.id,
        roles: [req.user.role],
        attr: {
          department: req.user.department,
        },
      },
      queryPlan: contactQueryPlan.filter,
      prismaQuery: filters,
    });
  }

  return res.json({
    contacts,
  });
});

// READ
app.get("/contacts/:id", async (req, res) => {
  // Get the user
  if (!req.user) return res.status(404).json({ error: "User not found" });

  // load the contact
  const contact = await prisma.contact.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  // check user is authorized
  const allowed = await cerbos.check({
    principal: {
      id: req.user.id,
      roles: [req.user.role],
      attr: {
        department: req.user.department,
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
  if (allowed.isAuthorized(contact.id, "read")) {
    return res.json(contact);
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

app.post("/contacts/new", async (req, res) => {
  // Get the user

  // check user is authorized
  const allowed = await cerbos.check({
    principal: {
      id: req.user.id,
      roles: [req.user.role],
      attr: {
        department: req.user.department,
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
    const contact = await prisma.contact.create({
      data: req.body,
    });
    return res.json({ result: "Created contact", contact });
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

app.patch("/contacts/:id", async (req, res) => {
  // load the contact
  const contact = await prisma.contact.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const allowed = await cerbos.check({
    principal: {
      id: req.user.id,
      roles: [req.user.role],
      attr: {
        department: req.user.department,
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
    await prisma.contact.update({
      where: {
        id: contact.id,
      },
      data: req.body,
    });
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
      id: req.params.id,
    },
    include: {
      company: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const allowed = await cerbos.check({
    principal: {
      id: req.user.id,
      roles: [req.user.role],
      attr: {
        department: req.user.department,
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
        id: req.params.id,
      },
    });
    return res.json({
      result: `Contact ${req.params.id} deleted`,
    });
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }
});

const server = app.listen(3030, () =>
  console.log(`🚀 Server ready at: http://localhost:3030`)
);
