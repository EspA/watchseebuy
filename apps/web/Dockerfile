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
RUN npm run build -w @waitseebuy/web
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@waitseebuy/web"]
