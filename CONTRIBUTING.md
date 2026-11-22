# Contributing / Como contribuir

Thanks for helping! The project follows a public [roadmap](https://ettorecsenatore.github.io/varhub-client/en/docs/roadmap) (R1 to R7) and a
[decision log](https://ettorecsenatore.github.io/varhub-client/en/docs/projeto/decisoes). By contributing you agree that your contribution is licensed under
the AGPL-3.0-or-later (see [LICENSE](LICENSE)).

## Development

```bash
npm install
cp .env.example .env     # JWT_SECRET, DB_* (a local PostgreSQL, e.g. Docker; see the Development docs)
npm run db:seed
npm run dev
npm test                 # integration tests against a real PostgreSQL (database varhub_test)
```

## Conventions

- **Tests:** a behavior change comes with a test. Queries are always parameterized.
- **Migrations:** schema changes go in a new `db/migrations/NNN_name.sql`, safe to run twice. Do not drop or rename a column the current version uses in one step: migrations are never undone on rollback.
- **Docs in two languages:** change the Portuguese and the English page together (in the `varhub-client` repository).
- **Releases:** a user-visible change gets an entry in `releases.yaml` (English and pt-BR), and the version in `package.json` goes up (SemVer). CI creates the tag and the GitHub Release.
- **Dependencies:** pin and justify new ones; `npm audit` and the license audit (AGPL-compatible) run in CI.
- **Decisions:** an important choice gets a row in the decision log.

## Pull requests

1. Fork, branch, make the change with tests.
2. Open a pull request explaining what and why. CI must be green.
3. Squash-merge once reviewed.

## Em português

Abra uma issue ou um PR explicando o quê e por quê. Mudou comportamento? Inclua testes, atualize a documentação nos dois idiomas, adicione uma entrada em `releases.yaml` e suba a versão. Mudanças de esquema entram em uma nova migração em `db/migrations/`.
