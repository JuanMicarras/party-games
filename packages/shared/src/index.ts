export const SocketEvents = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  ROOM_UPDATED: "room_updated",
  LEAVE_ROOM: "leave_room",
  START_GAME: 'start_game',
  CARD_ACTION: 'card_action',
  START_TURN: 'start_turn',
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
// NUEVO: Estructura de una carta de Mimireto
export interface MimiretoCard {
  word: string;
  forbidden: string[];
}

// NUEVO: El estado específico de una partida de Mimireto
export interface MimiretoState {
  teamAScore: number;
  teamBScore: number;
  currentTurn: 'A' | 'B';
  speakerId: string | null; // Quien tiene que hacer adivinar
  judgeId: string | null;   // El rival que vigila las prohibidas
  currentCard: MimiretoCard | null;
  status: 'WAITING' | 'PLAYING' | 'TIME_UP';
  timeLeft: number; // <-- El reloj
  teamASpeakerIndex: number; // <-- Para saber quién sigue
  teamBSpeakerIndex: number;
}

export interface RoomState {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  hostId: string;
  mimireto?: MimiretoState;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}


export interface RoomUpdatedPayload {
  message: string;
  room: RoomState;
}

export interface StartGamePayload {
  roomCode: string;
}

export interface CardActionPayload {
  roomCode: string;
  action: 'SUCCESS' | 'PASS' | 'FOUL';
}