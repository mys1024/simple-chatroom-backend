import { Message } from "./types.ts";
import { APP_ON_DENO_DEPLOY } from "./config.ts";
import { ignoreErrorSync, isBroadcastMessage, isMessage } from "./util.ts";

const broadcastChannel = APP_ON_DENO_DEPLOY
  ? new BroadcastChannel("chat")
  : undefined;
const chatroomToWsArr = new Map<string, Set<WebSocket>>();

function forwardMessage(
  chatroom: string,
  msg: Message,
  wsSet?: Set<WebSocket>,
  from?: WebSocket,
  ch?: BroadcastChannel,
) {
  // broadcast forward
  ch?.postMessage(JSON.stringify({ chatroom, ...msg }));
  // local forward
  if (!wsSet) {
    return;
  }
  for (const otherWs of wsSet) {
    if (otherWs === from) {
      continue;
    }
    if (otherWs.readyState === WebSocket.CLOSED) {
      wsSet.delete(otherWs);
      continue;
    }
    otherWs.send(JSON.stringify(msg));
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (evt) => {
    const data = evt.data;
    console.info(data);
    // parse broadcast message
    if (typeof data !== "string") {
      return;
    }
    const msg = ignoreErrorSync(() => JSON.parse(data));
    console.info(msg, isBroadcastMessage(msg));
    if (!isBroadcastMessage(msg)) {
      return;
    }
    const { chatroom, sender, body } = msg;
    // forward
    const wsSet = chatroomToWsArr.get(chatroom);
    forwardMessage(chatroom, { sender, body }, wsSet);
  };
}

function setupWebSocket(ws: WebSocket, chatroom: string) {
  // add ws to a chatroom
  let wsSet = chatroomToWsArr.get(chatroom);
  if (!wsSet) {
    wsSet = new Set();
    chatroomToWsArr.set(chatroom, wsSet);
  }
  wsSet.add(ws);
  // handle message
  ws.onmessage = (evt) => {
    const data = evt.data;
    // parse message
    if (typeof data !== "string") {
      return;
    }
    const msg = ignoreErrorSync(() => JSON.parse(data));
    if (!isMessage(msg)) {
      return;
    }
    // forward
    const wsSet = chatroomToWsArr.get(chatroom);
    forwardMessage(chatroom, msg, wsSet, ws, broadcastChannel);
  };
  // handle error
  ws.onerror = (e) => {
    // deno-lint-ignore no-explicit-any
    const message = (e as any)?.message;
    console.log("socket errored: ", message ? message : e);
  };
}

export default function app(req: Request) {
  let response: Response;
  let socket: WebSocket;
  // parse chatroom
  const chatroom = /^http(s):\/\/[^\/]+\/(?<chatroom>[^\/]+)$/
    .exec(req.url)?.groups?.chatroom;
  if (!chatroom) {
    return new Response("request doesn't specify a chatroom.", { status: 400 });
  }
  // upgrade to WebSocket
  try {
    ({ response, socket } = Deno.upgradeWebSocket(req));
  } catch {
    return new Response("request isn't trying to upgrade to websocket.", {
      status: 400,
    });
  }
  // setup WebSocket
  setupWebSocket(socket, chatroom);
  // http response
  return response;
}
