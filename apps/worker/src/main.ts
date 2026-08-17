import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@community-os/config";
import { createDatabase } from "@community-os/database";
import { expireTemporaryRoles } from "./jobs/temporary-roles.js";

const config = loadConfig();
const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
const { db, client } = createDatabase(config.DATABASE_URL);

export const communityJobs = new Queue("community-os", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 5000 }
  }
});

const worker = new Worker("community-os", async (job) => {
  switch (job.name) {
    case "expire-role":
      return { expired: await expireTemporaryRoles(db) };
    default:
      throw new Error(`Unknown job: ${job.name}`);
  }
}, {
  connection,
  concurrency: 10
});

const scheduler = await communityJobs.upsertJobScheduler(
  "temporary-role-expiration",
  { every: 30_000 },
  { name: "expire-role", data: {} }
);

worker.on("completed", (job, result) => {
  console.log("background job completed", { jobId: job.id, type: job.name, result });
});

worker.on("failed", (job, error) => {
  console.error("background job failed", { jobId: job?.id, type: job?.name, error });
});

const shutdown = async () => {
  await worker.close();
  await communityJobs.close();
  await connection.quit();
  await client.end();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log("Community OS worker started", { scheduler: scheduler.key });
