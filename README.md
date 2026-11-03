# Barbearia Prime

Nova base da aplicação para execução com Docker: Next.js + React Router no front-end, Fastify no back-end e PostgreSQL com Drizzle ORM. Os arquivos PHP antigos permanecem no repositório como referência da versão anterior; a aplicação Docker é servida pelos diretórios `apps/web` e `apps/api`.

## Executar localmente

1. Instale Docker Desktop com Docker Compose e Node.js 22 ou superior (Node é necessário somente para executar scripts locais; os serviços de aplicação rodam nos containers).
2. Copie `.env.example` para `.env`. Ajuste a senha do PostgreSQL, o segredo JWT e os dados do administrador inicial. O CPF do administrador precisa ser válido e o e-mail ainda não pode estar cadastrado.
3. Na raiz do repositório, execute `docker compose up --build`.
4. Abra `http://localhost:3000`. A documentação OpenAPI/Swagger está em `http://localhost:3333/docs`.

O container da API aplica as migrations Drizzle versionadas em `apps/api/drizzle` ao iniciar. Para recriar o banco durante desenvolvimento, pare os serviços e remova o volume `postgres_data` com `docker compose down -v`; isso apaga os dados locais.

## Cadastro e permissões

- `POST /auth/register` cria somente contas `CUSTOMER`, sempre validadas pelo CPF, e-mail e política de senha.
- `POST /auth/register/employee` exige um JWT de administrador. O formulário correspondente também fica protegido no front-end.
- Clientes podem consultar `/users/me` e `/users/me/appointments`, que filtram pelo identificador do token.
- Funcionários podem consultar o dashboard, cujas métricas ficam restritas aos próprios atendimentos. Administradores podem ver o conjunto da barbearia.
- Login emite JWT de acesso curto e cookie httpOnly de renovação rotativo. A senha é armazenada com scrypt; o refresh token é armazenado somente como hash.

## Desenvolvimento

Os schemas compartilhados com Zod ficam em `packages/contracts`. O back-end mantém domínios, rotas, serviços de autenticação, acesso Drizzle e rotas analíticas em `apps/api/src`. A interface Next/React Router está em `apps/web/src`.

Use `npm install` na raiz quando quiser executar `npm run typecheck` ou os scripts de build fora do Docker. Para gerar migrations Drizzle, execute `npm run db:generate --workspace @barbearia/api` e revise o SQL criado antes de aplicá-lo.

Os gráficos exibem série temporal diária de agendamentos e barras de serviços mais solicitados. Os valores são previstos a partir dos preços registrados no agendamento; a tabela de pagamentos reais e a implantação de produção não fazem parte deste estágio.
