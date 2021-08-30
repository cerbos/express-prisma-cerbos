# express-prisma-cerbos

An example application of integrating [Cerbos](https://cerbos.dev) with an [Express](https://expressjs.com/) server using [Prisma](https://prisma.io/) as the ORM.

## Dependencies

- Node.js
- Docker for running the [Cerbos Policy Decision Point (PDP)](https://docs.cerbos.dev/cerbos/installation/container.html)

## Getting Started

1. Start up the Cerbos PDP instance docker container. This will be called by the express app to check authorization.

```bash
cd cerbos
./start.sh
```

2. Install node dependencies

```bash
npm install
```

3. Setup Prisma and seed the database

```
npx prisma migrate dev --name init
npx prisma db seed --preview-feature
```

4. Start the express server

```bash
npm run dev
```

## Seed Users

The Prisma seed command will create the following users in the database. Authentication is done via Basic authentication using the following credentials. The Role and Department is loaded from the database after successful authentication.

| ID  | Username | Password     | Role  | Department |
| --- | -------- | ------------ | ----- | ---------- |
| 1   | alice    | supersecret  | Admin | IT         |
| 2   | john     | password1234 | User  | Sales      |
| 3   | sarah    | asdfghjkl    | User  | Sales      |
| 4   | geri     | pwd123       | User  | Marketing  |

## Policies

This example has a simple CRUD policy in place for a resource kind of `contact` - like a CRM system would have. The policy file can be found in the `cerbos/policies` folder [here](https://github.com/cerbos/express-prisma-cerbos/blob/main/cerbos/policies/contact.yaml).

Should you wish to experiment with this policy, you can <a href="https://play.cerbos.dev/p/ygW612cc9c9xXOsOZjI40ovY2LZvXf43" target="_blank">try it in the Cerbos Playground</a>.

<a href="https://play.cerbos.dev/p/ygW612cc9c9xXOsOZjI40ovY2LZvXf43" target="_blank"><img src="docs/launch.jpg" height="48" /></a>

The policy expects one of two roles to be set on the principal - `admin` and `user` and an attribute which defines their department as either `IT`, `Sales` or `Marketing`.

These roles are authorized as follows:

| Action   | Role: User                                  | Role: Admin |
| -------- | ------------------------------------------- | ----------- |
| `read`   | Only if department is `Sales`               | Y           |
| `create` | Only if department is `Sales`               | Y           |
| `update` | Only if they own the contact being accessed | Y           |
| `delete` | Only if they own the contact being accessed | Y           |

## Example Requests

### Get a contact

As a Sales user => `200 OK`

```
curl -i http://john:password1234@localhost:3000/contacts/1
```

As a Marketing user => `403 Unauthorized`

```
curl -i http://geri:pwd123@localhost:3000/contacts/1
```
