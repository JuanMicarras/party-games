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

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface AvailableCategories {
  mimireto: CategoryInfo[];
  cuentoChino: CategoryInfo[];
}

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
  teamAPlayerIds?: string[];
  teamBPlayerIds?: string[];
  categoryId?: string;
  categoryName?: string;
  turnDuration?: number; // Segundos configurados por turno (45, 60, 90, 120)
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
  categoryId?: string;
  categoryName?: string;
  writingTime?: number; // Segundos configurados para inventar mentiras (30, 45, 60)
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
  availableCategories?: AvailableCategories;
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
  roundsMultiplier?: number; // Para Mimireto (1x, 2x, 3x)
  turnDuration?: number;     // Segundos por turno en Mimireto (45, 60, 90, 120)
  totalQuestions?: number;   // Para Cuento Chino (3, 5, 7, 10 preguntas)
  writingTime?: number;      // Segundos para escribir mentiras en Cuento Chino (30, 45, 60)
  category?: string;         // Categoría seleccionada (ej: 'biblico', 'cultura-pop', 'general', 'amigos', 'custom')
  customCategoryName?: string;
  customMimiretoDeck?: MimiretoCard[];
  customCuentoChinoDeck?: CuentoChinoQuestion[];
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

// ----------------------------------------------------
// VALIDADORES DE MAZOS PERSONALIZADOS
// ----------------------------------------------------
export function validateMimiretoDeck(input: unknown): {
  valid: boolean;
  cards: MimiretoCard[];
  error?: string;
} {
  if (!Array.isArray(input)) {
    return {
      valid: false,
      cards: [],
      error: 'El formato debe ser un arreglo JSON (ej: [ { "word": "...", "forbidden": [...] } ]).',
    };
  }

  if (input.length === 0) {
    return {
      valid: false,
      cards: [],
      error: 'El mazo está vacío. Agrega al menos 1 carta.',
    };
  }

  const cards: MimiretoCard[] = [];
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        cards: [],
        error: `La carta en la posición #${i + 1} no es un objeto válido.`,
      };
    }

    const rawWord = (item as Record<string, unknown>).word;
    const rawForbidden = (item as Record<string, unknown>).forbidden;

    if (typeof rawWord !== 'string' || rawWord.trim().length === 0) {
      return {
        valid: false,
        cards: [],
        error: `La carta #${i + 1} no tiene un campo "word" (palabra principal) válido.`,
      };
    }

    if (!Array.isArray(rawForbidden) || rawForbidden.length === 0) {
      return {
        valid: false,
        cards: [],
        error: `La carta "${rawWord}" (#${i + 1}) debe incluir un arreglo "forbidden" con al menos 1 palabra prohibida.`,
      };
    }

    const forbidden = rawForbidden
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      .map((f) => f.trim().toUpperCase());

    if (forbidden.length === 0) {
      return {
        valid: false,
        cards: [],
        error: `La carta "${rawWord}" (#${i + 1}) no tiene palabras prohibidas de texto válidas.`,
      };
    }

    cards.push({
      word: rawWord.trim().toUpperCase(),
      forbidden,
    });
  }

  return { valid: true, cards };
}

export function validateCuentoChinoDeck(input: unknown): {
  valid: boolean;
  questions: CuentoChinoQuestion[];
  error?: string;
} {
  if (!Array.isArray(input)) {
    return {
      valid: false,
      questions: [],
      error: 'El formato debe ser un arreglo JSON de preguntas.',
    };
  }

  if (input.length === 0) {
    return {
      valid: false,
      questions: [],
      error: 'El mazo de preguntas está vacío. Agrega al menos 1 pregunta.',
    };
  }

  const questions: CuentoChinoQuestion[] = [];
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        questions: [],
        error: `La pregunta en la posición #${i + 1} no es un objeto válido.`,
      };
    }

    const rec = item as Record<string, unknown>;
    const rawQuestion = rec.question;
    const rawCorrect = rec.correctAnswer;
    const rawReference = rec.reference;
    const rawAccepted = rec.acceptedAnswers;
    const rawDefaultLies = rec.defaultLies;

    if (typeof rawQuestion !== 'string' || rawQuestion.trim().length === 0) {
      return {
        valid: false,
        questions: [],
        error: `La pregunta #${i + 1} no tiene un campo "question" válido.`,
      };
    }

    if (typeof rawCorrect !== 'string' || rawCorrect.trim().length === 0) {
      return {
        valid: false,
        questions: [],
        error: `La pregunta #${i + 1} ("${rawQuestion.slice(0, 30)}...") no tiene "correctAnswer" válido.`,
      };
    }

    if (!Array.isArray(rawDefaultLies) || rawDefaultLies.length === 0) {
      return {
        valid: false,
        questions: [],
        error: `La pregunta #${i + 1} debe incluir un arreglo "defaultLies" con mentiras de respaldo.`,
      };
    }

    const defaultLies = rawDefaultLies
      .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      .map((l) => l.trim());

    if (defaultLies.length === 0) {
      return {
        valid: false,
        questions: [],
        error: `La pregunta #${i + 1} no tiene mentiras válidas en "defaultLies".`,
      };
    }

    const correctAnswer = rawCorrect.trim();
    const acceptedAnswers = Array.isArray(rawAccepted)
      ? rawAccepted
          .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
          .map((a) => a.trim())
      : [correctAnswer];

    if (!acceptedAnswers.includes(correctAnswer)) {
      acceptedAnswers.unshift(correctAnswer);
    }

    questions.push({
      id: typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : `custom-${i + 1}`,
      question: rawQuestion.trim(),
      reference:
        typeof rawReference === 'string' && rawReference.trim().length > 0
          ? rawReference.trim()
          : 'Curiosidad',
      correctAnswer,
      acceptedAnswers,
      defaultLies,
    });
  }

  return { valid: true, questions };
}