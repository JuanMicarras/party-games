export const SocketEvents = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  ROOM_UPDATED: "room_updated",
  LEAVE_ROOM: "leave_room",
  START_GAME: 'start_game',
  CARD_ACTION: 'card_action',
  START_TURN: 'start_turn',
  PLAY_SOUND: 'play_sound',
  RESET_TO_LOBBY: 'reset_to_lobby',
  SUBMIT_LIE: 'submit_lie',
  SUBMIT_VOTE: 'submit_vote',
  NEXT_QUESTION: 'next_question',
  LIE_FEEDBACK: 'lie_feedback',
  ERROR: "error",
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

export type GameMode = "LOBBY" | "MIMIRETO" | "CUENTO_CHINO";

export interface Player {
  id: string;
  name: string;
  team?: "A" | "B";
  isHost: boolean;
  connected?: boolean;
}

// ----------------------------------------------------
// MIMIRETO
// ----------------------------------------------------
export interface MimiretoCard {
  word: string;
  forbidden: string[];
}

export interface MimiretoState {
  teamAScore: number;
  teamBScore: number;
  currentTurn: 'A' | 'B';
  speakerId: string | null;
  judgeId: string | null;
  currentCard: MimiretoCard | null;
  status: 'WAITING' | 'PLAYING' | 'TIME_UP' | 'FINISHED' | 'PAUSED';
  timeLeft: number;
  teamASpeakerIndex: number;
  teamBSpeakerIndex: number;
  totalTurns: number;
  turnsPlayed: number;
}

// ----------------------------------------------------
// CITA VERDADERA O CUENTO CHINO (FIBBAGE / MENTIROSO)
// ----------------------------------------------------
export interface CuentoChinoQuestion {
  id: string;
  question: string;
  reference: string; // ej: "Jueces 3:17"
  correctAnswer: string;
  acceptedAnswers: string[];
  defaultLies: string[];
}

export interface CuentoChinoOption {
  id: string;
  text: string;
  authorId: string | null;
  isCorrect: boolean;
  isSabioLie: boolean;
}

export interface RoundEvent {
  voterId: string;
  voterName: string;
  optionText: string;
  result: 'CORRECT' | 'FOOLED_BY_PLAYER' | 'FOOLED_BY_SABIO' | 'DEFAULT_LIE';
  authorName?: string;
  pointsDelta: number;
}

export interface CuentoChinoState {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: CuentoChinoQuestion | null;
  status: 'WRITING_LIES' | 'VOTING' | 'REVEALING' | 'FINISHED' | 'PAUSED';
  timeLeft: number;
  submittedLies: Record<string, string>; // playerId -> lie (en minúsculas)
  sabioPlayerIds: string[]; // Jugadores que acertaron la respuesta en la fase de engaño
  options: CuentoChinoOption[];
  votes: Record<string, string>; // playerId -> optionId
  scores: Record<string, number>; // playerId -> puntos acumulados
  roundEvents: RoundEvent[];
}

// ----------------------------------------------------
// SALA GENERAL
// ----------------------------------------------------
export interface RoomState {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  hostId: string;
  mimireto?: MimiretoState;
  cuentoChino?: CuentoChinoState;
}

// ----------------------------------------------------
// PAYLOADS
// ----------------------------------------------------
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
  gameMode?: GameMode;
  roundsMultiplier?: number; // Para Mimireto (1x rápida, 2x estándar)
  totalQuestions?: number;   // Para Cuento Chino (3 o 5 preguntas)
}

export interface CardActionPayload {
  roomCode: string;
  action: 'SUCCESS' | 'PASS' | 'FOUL';
}

export interface PlaySoundPayload {
  sound: 'SUCCESS' | 'FOUL' | 'TICK' | 'TIME_UP';
}

export interface ResetToLobbyPayload {
  roomCode: string;
}

export interface SubmitLiePayload {
  roomCode: string;
  lie: string;
}

export interface SubmitVotePayload {
  roomCode: string;
  optionId: string;
}

export interface LieFeedbackPayload {
  status: 'ACCEPTED' | 'SABIO' | 'DUPLICATE';
  message: string;
  bonusPoints?: number;
}

export interface NextQuestionPayload {
  roomCode: string;
}