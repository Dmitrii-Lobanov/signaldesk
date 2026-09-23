FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web/next.config.ts apps/web/tsconfig.json apps/web/
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
RUN npm run build --workspace=apps/web

ENV NODE_ENV=production
ENV PORT=3000

USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]