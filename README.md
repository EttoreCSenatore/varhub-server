# VARHub (servidor)

[English](README.en.md) · **Português**

API do **VARHub**, a plataforma de marketing com realidade aumentada do **VARLab** (meu projeto final no Conestoga College). Express + PostgreSQL (Neon): contas com JWT, projetos, feedback, analytics e notificações push (Firebase).

📖 Documentação (arquitetura, API, segurança): https://ettorecsenatore.github.io/varhub-client/ · Cliente: [varhub-client](https://github.com/EttoreCSenatore/varhub-client)

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha JWT_SECRET e os dados do banco
npm run db:migrate   # cria as tabelas (npm run db:seed para dados de demonstração)
npm run dev
```

Rotas protegidas exigem `Authorization: Bearer <token>`. Lista completa em [API](https://ettorecsenatore.github.io/varhub-client/docs/tecnico/api). Vulnerabilidades: [SECURITY.md](SECURITY.md).

## Licença

[MIT](LICENSE.txt)
