import { serve } from "./deps.ts";
import { HTTP_PORT } from "./config.ts";
import app from "./app.ts";

serve(app, { port: HTTP_PORT });
