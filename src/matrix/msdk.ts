export interface MatrixClient {
  on(eventType: string, callback: Function) : void;
}