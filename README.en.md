# VARHub (server)

**English** · [Português](README.md)

API for **VARHub**, a free concept for **publishing VR and AR projects for companies and schools**, adaptable by any business or institution. Express + PostgreSQL: projects, anonymous feedback, usage events, accounts with roles (visitor and admin), a metrics dashboard and push notifications. It started as my capstone project at Conestoga College, with VARLab as the original use case.

📖 Documentation (architecture, API, security): https://ettorecsenatore.github.io/varhub-client/en/ · Client: [varhub-client](https://github.com/EttoreCSenatore/varhub-client)

## Running locally

```bash
npm install
cp .env.example .env   # fill in JWT_SECRET and the database details
npm run db:migrate   # creates the tables (npm run db:seed for demo data)
npm run dev
```

Protected routes require `Authorization: Bearer <token>`. Full list in [API](https://ettorecsenatore.github.io/varhub-client/en/docs/tecnico/api). Vulnerabilities: [SECURITY.md](SECURITY.md).

## License

[GNU AGPL-3.0-or-later](LICENSE) (free software): use, modify and distribute it, including commercially; if you host a modified version, offer its source code to the users. The names and logos of VARLab and Conestoga College are not licensed. Copyright © 2025-2026 Ettore Ciambra Senatore.
