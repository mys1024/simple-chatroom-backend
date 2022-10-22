import { serve } from "./deps.ts";

serve(handler, { port: 9999 });

function handler(req: Request): Response {
  let response, socket: WebSocket;
  try {
    ({ response, socket } = Deno.upgradeWebSocket(req));
  } catch {
    return new Response("request isn't trying to upgrade to websocket.");
  }
  socket.onopen = () => {
    console.log("socket opened");
    setInterval(() => {
      socket.send(`[${new Date().toString()}] Greeting from Deno Deploy`);
    }, 2000)
  }
  socket.onmessage = (e) => {
    console.log("socket message:", e.data);
    socket.send(e.data);
  };
  socket.onerror = (e) => console.log("socket errored:", e);
  socket.onclose = () => console.log("socket closed");
  return response;
}
