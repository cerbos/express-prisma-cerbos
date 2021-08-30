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

## Policies

This example has a simple CRUD policy in place for a resource kind of `contact` - like a CRM system would have. The policy file can be found in the `cerbos/policies` folder [here](https://github.com/cerbos/express-prisma-cerbos/blob/main/cerbos/policies/contact.yaml).

Should you wish to experiment with this policy, you can <a href="https://play.cerbos.dev/p/sZC611cf06deexP0q8CTcVufTVau1SA3" target="_blank">try it in the Cerbos Playground</a>.

<a href="https://play.cerbos.dev/p/sZC611cf06deexP0q8CTcVufTVau1SA3" target="_blank"><img src="docs/launch.jpg" height="48" /></a>

The policy expects one of two roles to be set on the principal - `admin` and `user`. These roles are authorized as follows:

| Action | User | Admin |
| ------ | ---- | ----- |
| list   | Y    | Y     |
| read   | Y    | Y     |
| create | N    | Y     |
| update | N    | Y     |
| delete | N    | Y     |
