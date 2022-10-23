import { APP_ON_DENO_DEPLOY } from "./config.ts";
import {
  forwardToChannel,
  forwardToWsSet,
  parseBroadcastMessage,
  parseMessage,
} from "./util.ts";

const chatroomToWsArr = new Map<string, Set<WebSocket>>();
const broadcastChannel = APP_ON_DENO_DEPLOY
  ? new BroadcastChannel("chat")
  : undefined;

if (broadcastChannel) {
  broadcastChannel.onmessage = (evt) => {
    // parse broadcast message
    const broadcastMsg = parseBroadcastMessage(evt.data);
    if (!broadcastMsg) {
      return;
    }
    const { chatroom, sender, body } = broadcastMsg;
    // forward to WS set
    const wsSet = chatroomToWsArr.get(chatroom);
    if (wsSet) {
      forwardToWsSet({ sender, body }, wsSet);
    }
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
    // parse message
    const msg = parseMessage(evt.data);
    if (!msg) {
      return;
    }
    // forward to broadcast channel
    if (broadcastChannel) {
      forwardToChannel({ chatroom, ...msg }, broadcastChannel);
    }
    // forward to WS set
    const wsSet = chatroomToWsArr.get(chatroom);
    if (wsSet) {
      forwardToWsSet(msg, wsSet);
    }
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
