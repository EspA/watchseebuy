import { createServer } from "node:http";
import { tick } from "./tick.ts";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? error.cause.message : "";
  return cause ? `${cause}\n${error.message}` : error.message;
}

let inFlight: Promise<Record<string, unknown>> | null = null;

async function runTick() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const result = await tick();
      const payload = {
        at: new Date().toISOString(),
        ...result,
      };
      console.log(JSON.stringify(payload));
      return payload;
    } catch (error) {
      const payload = {
        at: new Date().toISOString(),
        error: describeError(error),
      };
      console.error(JSON.stringify(payload));
      throw error;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function listen(port: number) {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://worker.local").pathname;
    if (path === "/healthz" || path === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      return;
    }
    if (path === "/tick") {
      if (req.method !== "GET" && req.method !== "POST") {
        res.writeHead(405).end("method not allowed");
        return;
      }
      void runTick()
        .then((payload) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(payload));
        })
        .catch((error) => {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              error: describeError(error),
            }),
          );
        });
      return;
    }
    res.writeHead(404).end("not found");
  });
  server.listen(port, () => {
    console.log(`WatchSeeBuy worker listening on ${port}`);
  });
}

async function main() {
  const port = Number(process.env.PORT);
  if (Number.isFinite(port) && port > 0) {
    listen(port);
    return;
  }

  console.log("WatchSeeBuy worker started");
  await runTick().catch(() => undefined);
  setInterval(() => {
    void runTick().catch(() => undefined);
  }, Number.isFinite(INTERVAL_MS) && INTERVAL_MS > 0 ? INTERVAL_MS : 60_000);
}

void main();
