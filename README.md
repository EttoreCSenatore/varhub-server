# VARHub (servidor)

[English](README.en.md) · **Português**

API do **VARHub**, um conceito livre para **publicar projetos de VR e AR para empresas e escolas**, que pode ser adaptado por qualquer negócio ou instituição. Express + PostgreSQL: projetos, feedback anônimo, eventos de uso, contas com papéis (visitante e administrador), painel de métricas e notificações push. Nasceu como o meu projeto final no Conestoga College, com o VARLab como caso de uso original.

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

[MIT](LICENSE.txt): software livre; use, modifique e distribua, inclusive comercialmente. Nomes e logotipos do VARLab e do Conestoga College não são licenciados.
