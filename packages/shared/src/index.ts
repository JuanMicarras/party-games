export interface Player {
  id: string;
  name: string;
  team?: 'A' | 'B';
  isHost: boolean;
}

export type GameMode = 'LOBBY' | 'MIMIRETO' | 'POPSAUCE';

export interface RoomState {
  code: string;
  gameMode: GameMode;
  players: Player[];
}

// Usamos 'as const' para que TypeScript infiera los valores exactos, no solo 'string'
export const SocketEvents = {
  JOIN_ROOM: 'join_room',
  ROOM_UPDATED: 'room_updated',
  ERROR: 'error',
} as const;

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface RoomUpdatedPayload {
  message: string;
  // Más adelante aquí meteremos el estado real: turnos, puntajes, la tarjeta actual de Mimireto
}