// packages/shared/src/index.ts

export const SocketEvents = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  ROOM_UPDATED: "room_updated",
  LEAVE_ROOM: "leave_room",
  ERROR: "error",
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

export type GameMode = "LOBBY" | "MIMIRETO" | "POPSAUCE";

export interface Player {
  id: string; // El ID del socket del cliente
  name: string;
  team?: "A" | "B";
  isHost: boolean;
}

// NUEVO: La estructura de la sala en la memoria del servidor
export interface RoomState {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  hostId: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

// ACTUALIZADO: Ahora el evento envía el estado completo de la sala
export interface RoomUpdatedPayload {
  message: string;
  room: RoomState;
}
