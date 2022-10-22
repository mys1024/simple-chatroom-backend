import { config as _config } from "./deps.ts";

const config = await _config();

export const APP_MODE: "dev" | "prod" = (
  Deno.env.get("APP_MODE") || config["APP_MODE"] || "dev"
) === "dev"
  ? "dev"
  : "prod";

export const APP_ON_DENO_DEPLOY: boolean = (
  Deno.env.get("APP_ON_DENO_DEPLOY") || config["APP_ON_DENO_DEPLOY"] || "false"
) === "true";

export const HTTP_PORT: number = Number(
  Deno.env.get("HTTP_PORT") || config["HTTP_PORT"],
) || 80;
