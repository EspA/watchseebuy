FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/ebay/package.json packages/ebay/
COPY packages/notify/package.json packages/notify/
RUN npm ci
COPY . .
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ENV BETTER_AUTH_SECRET=build-placeholder
RUN npm run build -w @watchseebuy/web
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "run", "start", "-w", "@watchseebuy/web"]
