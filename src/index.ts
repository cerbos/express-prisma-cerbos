import {PrismaClient} from "@prisma/client";
import express from "express";
import {Cerbos, IResourcesQueryPlanResponseConditionOperand} from "cerbos";
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
        where: {username: userAth.user},
    });
};

function mapFilter(data: IResourcesQueryPlanResponseConditionOperand) {
    const expr = data.expression;
    let operator = expr!.operator as string;
    if (operator === "eq") {
       operator = "equals"
    }
    let variable = expr!.operands?.find((op) => op.variable)!.variable as string;
    variable = variable.replace(/^R\.attr\./, "");
    const value = expr!.operands?.find((op) => op.value)!.value;
    return {operator, variable, value};
}

app.get("/sales", async (req, res) => {
    // Get the user
    const user = await getUser(req);
    if (!user) return res.status(404).json({error: "User not found"});
    try {
        const data = await cerbos.resourcesQueryPlan({
            principal: {
                id: `${user.id}`,
                roles: [user.role],
                attr: {
                    department: user.department,
                },
            },
            resourceKind: "user",
            action: "view:sales",
        });

        if (!data.filter) {
            return res.status(403).json({
                error: "Access denied",
                message: "You're not allowed to view users in sales department."
            });
        }

        let {operator, variable, value} = mapFilter(data.filter);

        const sales = await prisma.user.findMany({
            where: {
                [variable]: {
                    [operator]: value
                },
            },
        });
        res.json(sales);
    } catch (e) {
        console.log(e);
        return res.status(500).json({error: "Internal server error"});
    }
})

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
    if (!contact) return res.status(404).json({error: "Contact not found"});

    // Get the user
    const user = await getUser(req);
    if (!user) return res.status(404).json({error: "User not found"});

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
        return res.status(403).json({error: "Unauthorized"});
    }
});

app.post("/contacts/new", async (req, res) => {
    // Get the user
    const user = await getUser(req);
    if (!user) return res.status(404).json({error: "User not found"});

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
        const contact = await prisma.contact.create({
            data: req.body,
        });
        return res.json({result: "Created contact", contact});
    } else {
        return res.status(403).json({error: "Unauthorized"});
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
    if (!contact) return res.status(404).json({error: "Contact not found"});

    // Get the user
    const user = await getUser(req);
    if (!user) return res.status(404).json({error: "User not found"});

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
        return res.status(403).json({error: "Unauthorized"});
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
    if (!contact) return res.status(404).json({error: "Contact not found"});

    // Get the user
    const user = await getUser(req);
    if (!user) return res.status(404).json({error: "User not found"});

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
        return res.status(403).json({error: "Unauthorized"});
    }
});

const server = app.listen(3000, () =>
    console.log(`🚀 Server ready at: http://localhost:3000`)
);
