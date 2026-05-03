FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build --workspace @wallet/backend
RUN npm run build --workspace @wallet/shared

EXPOSE 4000
CMD ["sh", "-c", "npm run prisma:deploy && npm run start --workspace @wallet/backend"]
