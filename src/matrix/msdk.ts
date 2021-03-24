export interface MatrixClient {
  on(eventType: string, callback: (event: MatrixEvent) => void) : void
  startClient() : void
  store: MemoryStore
  sendEvent(roomId: string, type: string, content: any, dunno: string, callback: (err: any, res: any) => void): void
  sendEvent(roomId: string, type: string, content: any, dunno: string): Promise<void>
  sendStateEvent(roomId: string, type: string, content: any, stateKey: string): void
  getRoom(roomId: string): Room
  once(on: string, callback: (state: any, prevState: any, res: any) => void): void
}

export interface MatrixEvent {
  getType(): string
  getContent(): any
  getSender(): string
  getRoomId(): string
  getId(): string
  getStateKey(): string
}

export interface MemoryStore {
  rooms: Map<string, Room>
  users: Map<string, User>
}

export interface Room {
  roomId: string
  name: string
  currentState: RoomState
}

export interface RoomState {
  getStateEvents(eventType: string): MatrixEvent[]
  getStateEvents(eventType: string, stateKey: string): MatrixEvent
}

export interface User {
  userId: string
  name: string
}