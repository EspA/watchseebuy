import { tick } from "./tick.ts";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

async function runTick() {
  try {
    const result = await tick();
    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        ...result,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

async function main() {
  console.log("WaitSeeBuy worker started");
  await runTick();
  setInterval(() => {
    void runTick();
  }, Number.isFinite(INTERVAL_MS) && INTERVAL_MS > 0 ? INTERVAL_MS : 60_000);
}

void main();
