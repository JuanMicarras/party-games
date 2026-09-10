// packages/shared/src/index.ts

// Usamos 'as const' para que TypeScript infiera los valores literales exactos
export const SocketEvents = {
  JOIN_ROOM: 'join_room',
  ROOM_UPDATED: 'room_updated',
  LEAVE_ROOM: 'leave_room',
  ERROR: 'error',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

// Payloads de eventos
export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface RoomUpdatedPayload {
  message: string;
  roomCode?: string;
  // Próximamente: players, scores, roundState
}

// Entidades base compartidas
export type GameMode = 'LOBBY' | 'MIMIRETO' | 'POPSAUCE';

export interface Player {
  id: string;
  name: string;
  team?: 'A' | 'B';
  isHost: boolean;
}