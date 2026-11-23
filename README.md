# Barbearia Prime - Sistema de Gestão e Agendamentos

Aplicação moderna construída com **Next.js + React Router** no front-end, **Fastify** com **Drizzle ORM** no back-end, **MySQL 8.0** para persistência de dados e **Nginx** como Proxy Reverso, totalmente orquestrada via **Docker Compose** sob rede isolada.

---

## 🚀 Como Executar Localmente

### Via Docker Compose (Recomendado)

1. Certifique-se de ter o Docker Desktop instalado e ativo.
2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Suba todo o ecossistema (MySQL + API + Web + Nginx):
   ```bash
   docker compose up --build
   ```
4. Acesse no navegador:
   - **Aplicação Web**: [http://localhost](http://localhost) (porta padrão 80 via Nginx).
   - **Documentação da API**: [http://localhost/docs](http://localhost/docs).

### Execução de Testes e Tipos (TypeScript)

Na raiz do projeto:
```bash
npm run typecheck
npm run build
```
