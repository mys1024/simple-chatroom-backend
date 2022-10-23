// deno-lint-ignore-file no-explicit-any

import type { BroadcastMessage, Message } from "./types.ts";

export function ignoreErrorSync<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch (_) {
    return;
  }
}

export function isMessage(val: any): val is Message {
  return typeof val?.sender === "string" && typeof val?.body === "string";
}

export function isBroadcastMessage(val: any): val is BroadcastMessage {
  return typeof val?.chatroom === "string" && isMessage(val);
}

export function parseMessage(val: any) {
  if (typeof val !== "string") {
    return;
  }
  const msg = ignoreErrorSync(() => JSON.parse(val));
  return isMessage(msg) ? msg : undefined;
}

export function parseBroadcastMessage(val: any) {
  if (typeof val !== "string") {
    return;
  }
  const msg = ignoreErrorSync(() => JSON.parse(val));
  return isBroadcastMessage(msg) ? msg : undefined;
}

export function forwardToWsSet(msg: Message, wsSet: Set<WebSocket>) {
  for (const otherWs of [...wsSet]) {
    if (otherWs.readyState === WebSocket.CLOSED) {
      wsSet.delete(otherWs);
      continue;
    }
    otherWs.send(JSON.stringify(msg));
  }
}

export function forwardToChannel(msg: BroadcastMessage, ch: BroadcastChannel) {
  ch.postMessage(JSON.stringify(msg));
}
