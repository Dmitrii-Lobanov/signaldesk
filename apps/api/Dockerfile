FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/
COPY apps/api/src apps/api/src
RUN npm run build --workspace=apps/api

ENV NODE_ENV=production
ENV PORT=3001

USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]