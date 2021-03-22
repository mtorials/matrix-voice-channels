export interface MatrixClient {
  on(eventType: string, callback: (event: MatrixEvent) => void) : void
  startClient() : void
  store: MemoryStore
  sendEvent(roomId: string, type: string, content: any, dunno: string, callback: (err: any, res: any) => void): void
  sendEvent(roomId: string, type: string, content: any, dunno: string): void
}

export interface MatrixEvent {
  getType(): string
  getContent(): string
  getSender(): string
  getRoomId(): string
  getId(): string
}

export interface MemoryStore {
  rooms: Map<string, Room>
  users: Map<string, User>
}

export interface Room {
  roomId: string
  name: string
}

export interface User {
  userId: string
  name: string
}