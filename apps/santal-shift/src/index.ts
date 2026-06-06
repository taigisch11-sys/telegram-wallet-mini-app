import { createApp, handleScheduled } from "./app";
import type { WorkerEnv } from "./env";

const app = createApp();

export default {
  fetch: (request: Request, env: WorkerEnv, ctx: ExecutionContext) => app.fetch(request, env, ctx),
  scheduled: handleScheduled
};
