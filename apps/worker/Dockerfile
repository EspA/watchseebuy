FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/ebay/package.json packages/ebay/
RUN npm ci
COPY . .
CMD ["npm", "run", "start", "-w", "@waitseebuy/worker"]
