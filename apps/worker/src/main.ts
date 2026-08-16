import { Worker } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@community-os/config";

const config = loadConfig();
const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  "community-os",
  async (job) => {
    console.log(JSON.stringify({ jobId: job.id, name: job.name }, null, 2));
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`job completed: ${job.id ?? "unknown"}`);
});

worker.on("failed", (job, error) => {
  console.error(`job failed: ${job?.id ?? "unknown"}`, error);
});

const shutdown = async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
