import { createEbayClientFromEnv } from "@waitseebuy/ebay";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

async function tick() {
  const ebay = createEbayClientFromEnv();
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      ebayConfigured: ebay.isConfigured(),
      message:
        "Worker tick. Next: load due coverage_queries, poll once each, match watches, enqueue alerts.",
    }),
  );
}

async function main() {
  console.log("WaitSeeBuy worker started");
  await tick();
  setInterval(() => {
    void tick();
  }, INTERVAL_MS);
}

void main();
