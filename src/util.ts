import type { BroadcastMessage, Message } from "./types.ts";

export function ignoreErrorSync<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch (_) {
    return;
  }
}

// deno-lint-ignore no-explicit-any
export function isMessage(val: any): val is Message {
  return typeof val?.sender === "string" && typeof val?.body === "string";
}

// deno-lint-ignore no-explicit-any
export function isBroadcastMessage(val: any): val is BroadcastMessage {
  return typeof val?.chatroom === "string" && isMessage(val);
}
