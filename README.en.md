# VARHub (server)

**English** · [Português](README.md)

API for **VARHub**, **VARLab**'s augmented-reality marketing platform (my capstone project at Conestoga College). Express + PostgreSQL (Neon): JWT accounts, projects, feedback, analytics and push notifications (Firebase).

📖 Documentation (architecture, API, security): https://ettorecsenatore.github.io/varhub-client/en/ · Client: [varhub-client](https://github.com/EttoreCSenatore/varhub-client)

## Running locally

```bash
npm install
cp .env.example .env   # fill in JWT_SECRET and the database details
psql "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" -f db/schema.sql
npm start
```

Protected routes require `Authorization: Bearer <token>`. Full list in [API](https://ettorecsenatore.github.io/varhub-client/en/docs/tecnico/api). Vulnerabilities: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE.txt)
