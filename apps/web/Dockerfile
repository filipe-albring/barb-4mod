FROM node:22-alpine AS development
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
WORKDIR /workspace/apps/web
EXPOSE 3000
CMD ["npm", "run", "dev"]
