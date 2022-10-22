export interface Message {
  sender: string
  body: string
}

export interface BroadcastMessage extends Message {
  chatroom: string
}
