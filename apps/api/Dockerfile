FROM node:22-alpine AS base
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
COPY apps/web ./apps/web
WORKDIR /workspace/apps/api
EXPOSE 3333
CMD ["sh", "-c", "npm run db:migrate && npm run seed:admin && npm run dev"]
