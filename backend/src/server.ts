import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { startAccountDeletionSweep } from "./modules/users/accountDeletion.service";

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
  startAccountDeletionSweep();
}

main().catch((err) => {
  console.error("[api] failed to start", err);
  process.exit(1);
});
