import { serve } from "./deps.ts";
import { APP_MODE, APP_ON_DENO_DEPLOY, HTTP_PORT } from "./config.ts";
import app from "./app.ts";

console.info(`APP_MODE: ${APP_MODE}`);
console.info(`APP_ON_DENO_DEPLOY: ${APP_ON_DENO_DEPLOY}`);
console.info(`HTTP_PORT: ${HTTP_PORT}`);

serve(app, { port: HTTP_PORT });
